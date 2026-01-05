"""
SmartTask360 — Task service (business logic)
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.types import TaskStatus
from app.modules.tasks.models import Task, task_participants, task_watchers
from app.modules.tasks.schemas import (
    TaskAccept,
    TaskCreate,
    TaskReject,
    TaskStatusChange,
    TaskUpdate,
    UserBrief,
)
from app.modules.users.models import User


class TaskService:
    """Service for task operations with hierarchy support"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, task_id: UUID) -> Task | None:
        """Get task by ID (including soft-deleted)"""
        result = await self.db.execute(select(Task).where(Task.id == task_id))
        return result.scalar_one_or_none()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 100,
        include_deleted: bool = False,
        status: str | list[str] | None = None,
        priority: str | list[str] | None = None,
        search: str | None = None,
        project_id: UUID | None = None,
        assignee_id: UUID | None = None,
        creator_id: UUID | None = None,
        is_overdue: bool | None = None,
        parent_id: UUID | None = None,
    ) -> list[Task]:
        """Get all tasks with optional filters, ordered by path (hierarchical order)"""
        query = select(Task)

        if not include_deleted:
            query = query.where(Task.is_deleted == False)

        # Apply filters
        if status:
            if isinstance(status, list):
                query = query.where(Task.status.in_(status))
            else:
                query = query.where(Task.status == status)
        if priority:
            if isinstance(priority, list):
                query = query.where(Task.priority.in_(priority))
            else:
                query = query.where(Task.priority == priority)
        if search:
            search_pattern = f"%{search}%"
            query = query.where(
                Task.title.ilike(search_pattern) | Task.description.ilike(search_pattern)
            )
        if project_id:
            query = query.where(Task.project_id == project_id)
        if assignee_id:
            query = query.where(Task.assignee_id == assignee_id)
        if creator_id:
            query = query.where(Task.creator_id == creator_id)
        if is_overdue:
            # Tasks that are overdue: due_date < now AND status not in (done, cancelled)
            query = query.where(
                Task.due_date < func.current_date(),
                Task.status.notin_(["done", "cancelled"]),
            )
        if parent_id is not None:
            query = query.where(Task.parent_id == parent_id)

        query = query.order_by(Task.path).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_root_tasks(self) -> list[Task]:
        """Get all root-level tasks (depth = 0)"""
        result = await self.db.execute(
            select(Task)
            .where(Task.depth == 0)
            .where(Task.is_deleted == False)
            .order_by(Task.created_at.desc())
        )
        return list(result.scalars().all())

    async def get_children(self, task_id: UUID) -> list[Task]:
        """Get direct children of a task"""
        result = await self.db.execute(
            select(Task)
            .where(Task.parent_id == task_id)
            .where(Task.is_deleted == False)
            .order_by(Task.created_at)
        )
        return list(result.scalars().all())

    async def get_descendants(self, task_id: UUID) -> list[Task]:
        """Get all descendants of a task (entire subtree)"""
        parent_task = await self.get_by_id(task_id)
        if not parent_task:
            return []

        # Use ltree descendant operator (<@) to get all nodes under this path
        result = await self.db.execute(
            select(Task)
            .where(text(f"path <@ '{parent_task.path}'"))
            .where(Task.id != task_id)  # Exclude self
            .where(Task.is_deleted == False)
            .order_by(Task.path)
        )
        return list(result.scalars().all())

    async def get_ancestors(self, task_id: UUID) -> list[Task]:
        """Get all ancestors of a task (path to root)"""
        task = await self.get_by_id(task_id)
        if not task:
            return []

        # Use ltree ancestor operator (@>) to get all nodes above this path
        result = await self.db.execute(
            select(Task)
            .where(text(f"path @> '{task.path}'"))
            .where(Task.id != task_id)  # Exclude self
            .order_by(Task.path)
        )
        return list(result.scalars().all())

    async def get_by_assignee(
        self, assignee_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Task]:
        """Get tasks assigned to a specific user"""
        result = await self.db.execute(
            select(Task)
            .where(Task.assignee_id == assignee_id)
            .where(Task.is_deleted == False)
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_creator(
        self, creator_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Task]:
        """Get tasks created by a specific user"""
        result = await self.db.execute(
            select(Task)
            .where(Task.creator_id == creator_id)
            .where(Task.is_deleted == False)
            .order_by(Task.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def create(self, task_data: TaskCreate, current_user_id: UUID) -> Task:
        """Create new task

        - author_id: always set to current_user_id (who physically creates the task)
        - creator_id: set from task_data or defaults to current_user_id (on whose behalf)
        - assignee_id: set from task_data or defaults to creator_id
        """
        # Determine creator_id (defaults to current user)
        effective_creator_id = task_data.creator_id or current_user_id
        # Determine assignee_id (defaults to creator_id)
        effective_assignee_id = task_data.assignee_id if task_data.assignee_id is not None else effective_creator_id

        # Calculate path and depth
        if task_data.parent_id:
            parent = await self.get_by_id(task_data.parent_id)
            if not parent:
                raise ValueError(f"Parent task {task_data.parent_id} not found")
            if parent.is_deleted:
                raise ValueError("Cannot create subtask under deleted task")

            # Create task instance first to get its ID
            task = Task(
                title=task_data.title,
                description=task_data.description,
                status=task_data.status.value,
                priority=task_data.priority.value,
                author_id=current_user_id,  # Who physically created (immutable)
                creator_id=effective_creator_id,  # On whose behalf
                assignee_id=effective_assignee_id,  # Who will execute
                parent_id=task_data.parent_id,
                department_id=task_data.department_id,
                project_id=task_data.project_id,
                workflow_template_id=task_data.workflow_template_id,
                source_document_id=task_data.source_document_id,
                source_quote=task_data.source_quote,
                due_date=task_data.due_date,
                is_milestone=task_data.is_milestone,
                estimated_hours=task_data.estimated_hours,
                acceptance_deadline=task_data.acceptance_deadline,
                path="",  # Temporary, will update below
                depth=parent.depth + 1,
            )
            self.db.add(task)
            await self.db.flush()  # Get the ID without committing

            # Update path: parent.path + task.id (replace dashes for ltree compatibility)
            task.path = f"{parent.path}.{str(task.id).replace('-', '_')}"
        else:
            # Root task
            task = Task(
                title=task_data.title,
                description=task_data.description,
                status=task_data.status.value,
                priority=task_data.priority.value,
                author_id=current_user_id,  # Who physically created (immutable)
                creator_id=effective_creator_id,  # On whose behalf
                assignee_id=effective_assignee_id,  # Who will execute
                parent_id=None,
                department_id=task_data.department_id,
                project_id=task_data.project_id,
                workflow_template_id=task_data.workflow_template_id,
                source_document_id=task_data.source_document_id,
                source_quote=task_data.source_quote,
                due_date=task_data.due_date,
                is_milestone=task_data.is_milestone,
                estimated_hours=task_data.estimated_hours,
                acceptance_deadline=task_data.acceptance_deadline,
                path="",  # Temporary
                depth=0,
            )
            self.db.add(task)
            await self.db.flush()  # Get the ID

            # Update path: just the ID
            task.path = str(task.id).replace("-", "_")

        # Auto-assign status if assignee is set
        if task.assignee_id and task.status == TaskStatus.NEW.value:
            task.status = TaskStatus.ASSIGNED.value

        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def update(self, task_id: UUID, task_data: TaskUpdate) -> Task | None:
        """Update task"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return None

        # Update basic fields
        update_data = task_data.model_dump(exclude_unset=True, exclude={"parent_id"})

        # Convert enums to values
        if "status" in update_data and update_data["status"] is not None:
            update_data["status"] = update_data["status"].value
        if "priority" in update_data and update_data["priority"] is not None:
            update_data["priority"] = update_data["priority"].value

        for field, value in update_data.items():
            setattr(task, field, value)

        # Handle parent change (move in hierarchy)
        if "parent_id" in task_data.model_dump(exclude_unset=True):
            new_parent_id = task_data.parent_id

            # Prevent moving task under itself or its descendants
            if new_parent_id:
                descendants = await self.get_descendants(task_id)
                descendant_ids = {d.id for d in descendants}
                if new_parent_id in descendant_ids or new_parent_id == task_id:
                    raise ValueError("Cannot move task under itself or its descendants")

                new_parent = await self.get_by_id(new_parent_id)
                if not new_parent:
                    raise ValueError(f"Parent task {new_parent_id} not found")
                if new_parent.is_deleted:
                    raise ValueError("Cannot move task under deleted task")

                old_path = task.path
                new_path = f"{new_parent.path}.{str(task.id).replace('-', '_')}"
                task.parent_id = new_parent_id
                task.depth = new_parent.depth + 1
                task.path = new_path

                # Update paths of all descendants
                await self._update_descendant_paths(task, old_path)
            else:
                # Move to root
                old_path = task.path
                new_path = str(task.id).replace("-", "_")
                task.parent_id = None
                task.depth = 0
                task.path = new_path

                # Update paths of all descendants
                await self._update_descendant_paths(task, old_path)

        await self.db.commit()
        await self.db.refresh(task)
        return task

    async def _update_descendant_paths(self, task: Task, old_path: str):
        """Update paths of all descendants after parent change"""
        descendants = await self.db.execute(
            select(Task).where(text(f"path <@ '{old_path}'")).where(Task.id != task.id)
        )
        for descendant in descendants.scalars():
            # Replace old path prefix with new path
            relative_path = descendant.path[len(old_path) :]
            descendant.path = task.path + relative_path
            descendant.depth = descendant.path.count(".") if "." in descendant.path else 0

    async def delete(self, task_id: UUID) -> bool:
        """
        Soft delete task (set is_deleted = True).
        Optionally cascade to descendants.
        """
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return False

        # Soft delete
        task.is_deleted = True
        task.updated_at = datetime.utcnow()

        await self.db.commit()
        return True

    async def change_status(
        self, task_id: UUID, status_data: TaskStatusChange, user_id: UUID
    ) -> Task | None:
        """Change task status with optional comment"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return None

        old_status = task.status
        new_status = status_data.status.value

        # Update status
        task.status = new_status

        # Track started_at and completed_at
        if new_status == TaskStatus.IN_PROGRESS.value and not task.started_at:
            task.started_at = datetime.utcnow()
        elif new_status == TaskStatus.DONE.value and not task.completed_at:
            task.completed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(task)

        # TODO: Log status change in task_history
        # TODO: Create notification for assignee/creator

        return task

    async def accept_task(
        self, task_id: UUID, accept_data: TaskAccept, user_id: UUID
    ) -> Task | None:
        """Accept task as assignee"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return None

        # Verify user is assignee
        if task.assignee_id != user_id:
            raise ValueError("Only assignee can accept task")

        # Already accepted
        if task.accepted_at:
            raise ValueError("Task already accepted")

        # Accept task
        task.accepted_at = datetime.utcnow()
        task.status = TaskStatus.IN_PROGRESS.value
        task.started_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(task)

        # TODO: Create notification for creator

        return task

    async def reject_task(
        self, task_id: UUID, reject_data: TaskReject, user_id: UUID
    ) -> Task | None:
        """Reject task as assignee (has questions)"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return None

        # Verify user is assignee
        if task.assignee_id != user_id:
            raise ValueError("Only assignee can reject task")

        # Already accepted
        if task.accepted_at:
            raise ValueError("Cannot reject already accepted task")

        # Store rejection info
        task.rejection_reason = reject_data.reason.value
        task.rejection_comment = reject_data.comment

        await self.db.commit()
        await self.db.refresh(task)

        # TODO: Create notification for creator with rejection details

        return task

    # ===== Watchers Management =====

    async def add_watcher(self, task_id: UUID, user_id: UUID) -> bool:
        """Add user as watcher to task"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return False

        # Check if already watching
        result = await self.db.execute(
            select(task_watchers).where(
                task_watchers.c.task_id == task_id, task_watchers.c.user_id == user_id
            )
        )
        if result.first():
            return True  # Already watching

        # Add watcher
        await self.db.execute(
            task_watchers.insert().values(task_id=task_id, user_id=user_id)
        )
        await self.db.commit()
        return True

    async def remove_watcher(self, task_id: UUID, user_id: UUID) -> bool:
        """Remove user from task watchers"""
        result = await self.db.execute(
            sql_delete(task_watchers).where(
                task_watchers.c.task_id == task_id, task_watchers.c.user_id == user_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_watchers(self, task_id: UUID) -> list[UserBrief]:
        """Get list of users watching this task with their details"""
        result = await self.db.execute(
            select(User)
            .join(task_watchers, User.id == task_watchers.c.user_id)
            .where(task_watchers.c.task_id == task_id)
            .order_by(User.name)
        )
        return [UserBrief.model_validate(u) for u in result.scalars().all()]

    async def get_watched_tasks(self, user_id: UUID) -> list[Task]:
        """Get all tasks user is watching"""
        result = await self.db.execute(
            select(Task)
            .join(task_watchers, Task.id == task_watchers.c.task_id)
            .where(task_watchers.c.user_id == user_id)
            .where(Task.is_deleted == False)
            .order_by(Task.updated_at.desc())
        )
        return list(result.scalars().all())

    # ===== Participants Management =====

    async def add_participant(self, task_id: UUID, user_id: UUID) -> bool:
        """Add user as participant to task"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return False

        # Check if already participant
        result = await self.db.execute(
            select(task_participants).where(
                task_participants.c.task_id == task_id,
                task_participants.c.user_id == user_id,
            )
        )
        if result.first():
            return True  # Already participant

        # Add participant
        await self.db.execute(
            task_participants.insert().values(task_id=task_id, user_id=user_id)
        )
        await self.db.commit()
        return True

    async def remove_participant(self, task_id: UUID, user_id: UUID) -> bool:
        """Remove user from task participants"""
        result = await self.db.execute(
            sql_delete(task_participants).where(
                task_participants.c.task_id == task_id,
                task_participants.c.user_id == user_id,
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def get_participants(self, task_id: UUID) -> list[UserBrief]:
        """Get list of users participating in this task with their details"""
        result = await self.db.execute(
            select(User)
            .join(task_participants, User.id == task_participants.c.user_id)
            .where(task_participants.c.task_id == task_id)
            .order_by(User.name)
        )
        return [UserBrief.model_validate(u) for u in result.scalars().all()]

    async def get_participated_tasks(self, user_id: UUID) -> list[Task]:
        """Get all tasks user is participating in"""
        result = await self.db.execute(
            select(Task)
            .join(task_participants, Task.id == task_participants.c.task_id)
            .where(task_participants.c.user_id == user_id)
            .where(Task.is_deleted == False)
            .order_by(Task.updated_at.desc())
        )
        return list(result.scalars().all())

    # ===== Workflow Integration =====

    async def change_status_with_workflow(
        self,
        task_id: UUID,
        new_status: str,
        user_role: str,
        comment: str | None = None,
    ) -> Task | None:
        """
        Change task status with workflow validation

        Validates transition using WorkflowService if task has workflow_template_id
        """
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return None

        old_status = task.status

        # If task has workflow, validate transition
        if task.workflow_template_id:
            from app.modules.workflow.service import WorkflowService

            workflow_service = WorkflowService(self.db)

            validation = await workflow_service.validate_transition(
                template_id=task.workflow_template_id,
                from_status=old_status,
                to_status=new_status,
                user_role=user_role,
                has_comment=bool(comment),
            )

            if not validation.is_valid:
                raise ValueError(validation.message or "Transition not allowed")

        # Update status
        task.status = new_status

        # Track started_at and completed_at
        if new_status == TaskStatus.IN_PROGRESS.value and not task.started_at:
            task.started_at = datetime.utcnow()
        elif new_status == TaskStatus.DONE.value and not task.completed_at:
            task.completed_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(task)

        # TODO: Log status change in task_history

        return task

    async def get_available_status_transitions(
        self, task_id: UUID, user_role: str
    ) -> list[str]:
        """
        Get available status transitions for task based on workflow and user role

        Returns list of status keys the user can transition to
        """
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return []

        if not task.workflow_template_id:
            # No workflow - return all standard statuses
            return [s.value for s in TaskStatus]

        from app.modules.workflow.service import WorkflowService

        workflow_service = WorkflowService(self.db)

        transitions = await workflow_service.get_available_transitions(
            template_id=task.workflow_template_id,
            current_status=task.status,
            user_role=user_role,
        )

        return [t.to_status for t in transitions]

    # ========================================================================
    # SMART Validation
    # ========================================================================

    async def update_smart_score(
        self, task_id: UUID, smart_score: dict, is_valid: bool
    ) -> Task | None:
        """Update task with SMART validation results"""
        task = await self.get_by_id(task_id)
        if not task or task.is_deleted:
            return None

        task.smart_score = smart_score
        task.smart_is_valid = is_valid
        task.smart_validated_at = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(task)
        return task

    # ========================================================================
    # Children Count
    # ========================================================================

    async def get_children_count(self, task_id: UUID) -> int:
        """Get count of direct (non-deleted) children for a task"""
        result = await self.db.execute(
            select(func.count(Task.id))
            .where(Task.parent_id == task_id)
            .where(Task.is_deleted == False)
        )
        return result.scalar() or 0

    async def get_children_counts(self, task_ids: list[UUID]) -> dict[UUID, int]:
        """Get children counts for multiple tasks in one query"""
        if not task_ids:
            return {}

        result = await self.db.execute(
            select(Task.parent_id, func.count(Task.id))
            .where(Task.parent_id.in_(task_ids))
            .where(Task.is_deleted == False)
            .group_by(Task.parent_id)
        )

        counts = {row[0]: row[1] for row in result.all()}
        # Fill in zeros for tasks with no children
        return {task_id: counts.get(task_id, 0) for task_id in task_ids}
