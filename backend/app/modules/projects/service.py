"""
SmartTask360 — Project service
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.types import ProjectMemberRole, ProjectStatus
from app.modules.projects.models import Project, ProjectMember
from app.modules.projects.schemas import (
    ProjectCreate,
    ProjectFilters,
    ProjectMemberCreate,
    ProjectStats,
    ProjectUpdate,
)


class ProjectService:
    """Service for project operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============================================================
    # Project CRUD
    # ============================================================

    async def create(self, data: ProjectCreate, owner_id: UUID) -> Project:
        """Create a new project and add owner as member"""
        project = Project(
            name=data.name,
            code=data.code,
            description=data.description,
            status=data.status.value if isinstance(data.status, ProjectStatus) else data.status,
            owner_id=owner_id,
            department_id=data.department_id,
            start_date=data.start_date,
            due_date=data.due_date,
            settings=data.settings,
        )
        self.db.add(project)
        await self.db.flush()

        # Add owner as member with owner role
        owner_member = ProjectMember(
            project_id=project.id,
            user_id=owner_id,
            role=ProjectMemberRole.OWNER.value,
        )
        self.db.add(owner_member)

        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def get_by_id(self, project_id: UUID) -> Project | None:
        """Get project by ID"""
        result = await self.db.execute(
            select(Project).where(
                Project.id == project_id,
                Project.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    async def get_by_code(self, code: str) -> Project | None:
        """Get project by code"""
        result = await self.db.execute(
            select(Project).where(
                Project.code == code.upper(),
                Project.is_deleted == False,
            )
        )
        return result.scalar_one_or_none()

    async def get_all(
        self,
        filters: ProjectFilters | None = None,
        user_id: UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Project], int]:
        """
        Get all projects with filters.
        If user_id is provided, only returns projects where user is a member.
        """
        query = select(Project).where(Project.is_deleted == False)

        # Apply filters
        if filters:
            if filters.status:
                query = query.where(Project.status == filters.status.value)
            if filters.owner_id:
                query = query.where(Project.owner_id == filters.owner_id)
            if filters.department_id:
                query = query.where(Project.department_id == filters.department_id)
            if filters.search:
                search_term = f"%{filters.search}%"
                query = query.where(
                    (Project.name.ilike(search_term)) | (Project.code.ilike(search_term))
                )
            if not filters.include_archived:
                query = query.where(Project.status != ProjectStatus.ARCHIVED.value)

        # Filter by membership if user_id provided
        if user_id:
            query = query.join(ProjectMember).where(ProjectMember.user_id == user_id)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        # Get projects with pagination
        query = query.order_by(Project.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        projects = list(result.scalars().all())

        return projects, total_count

    async def update(self, project_id: UUID, data: ProjectUpdate) -> Project | None:
        """Update a project"""
        project = await self.get_by_id(project_id)
        if not project:
            return None

        update_data = data.model_dump(exclude_unset=True)

        # Handle status as enum
        if "status" in update_data and update_data["status"]:
            if isinstance(update_data["status"], ProjectStatus):
                update_data["status"] = update_data["status"].value

        # Set completed_at when status changes to completed
        if update_data.get("status") == ProjectStatus.COMPLETED.value:
            update_data["completed_at"] = datetime.utcnow()

        for field, value in update_data.items():
            setattr(project, field, value)

        await self.db.commit()
        await self.db.refresh(project)
        return project

    async def delete(self, project_id: UUID) -> bool:
        """Soft delete a project"""
        result = await self.db.execute(
            update(Project)
            .where(Project.id == project_id, Project.is_deleted == False)
            .values(is_deleted=True, updated_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount > 0

    async def hard_delete(self, project_id: UUID) -> bool:
        """Permanently delete a project (for testing)"""
        result = await self.db.execute(
            delete(Project).where(Project.id == project_id)
        )
        await self.db.commit()
        return result.rowcount > 0

    # ============================================================
    # Project Statistics
    # ============================================================

    async def get_stats(self, project_id: UUID) -> ProjectStats:
        """Get project statistics"""
        from app.modules.boards.models import Board
        from app.modules.tasks.models import Task

        # Count tasks by status
        tasks_query = select(Task.status, func.count(Task.id)).where(
            Task.project_id == project_id,
            Task.is_deleted == False,
        ).group_by(Task.status)
        result = await self.db.execute(tasks_query)
        tasks_by_status = {row[0]: row[1] for row in result.all()}

        total_tasks = sum(tasks_by_status.values())
        completed_tasks = tasks_by_status.get("done", 0)

        # Count overdue tasks
        overdue_query = select(func.count(Task.id)).where(
            Task.project_id == project_id,
            Task.is_deleted == False,
            Task.status.notin_(["done", "cancelled"]),
            Task.due_date < datetime.utcnow(),
        )
        overdue_result = await self.db.execute(overdue_query)
        overdue_tasks = overdue_result.scalar() or 0

        # Count boards
        boards_query = select(func.count(Board.id)).where(
            Board.project_id == project_id,
            Board.is_archived == False,
        )
        boards_result = await self.db.execute(boards_query)
        total_boards = boards_result.scalar() or 0

        # Count members
        members_query = select(func.count(ProjectMember.user_id)).where(
            ProjectMember.project_id == project_id
        )
        members_result = await self.db.execute(members_query)
        total_members = members_result.scalar() or 0

        # Calculate completion percentage
        completion_percentage = 0.0
        if total_tasks > 0:
            completion_percentage = round((completed_tasks / total_tasks) * 100, 1)

        return ProjectStats(
            total_tasks=total_tasks,
            tasks_by_status=tasks_by_status,
            completed_tasks=completed_tasks,
            completion_percentage=completion_percentage,
            overdue_tasks=overdue_tasks,
            total_boards=total_boards,
            total_members=total_members,
        )

    # ============================================================
    # Project Members
    # ============================================================

    async def get_members(self, project_id: UUID) -> list[ProjectMember]:
        """Get all members of a project"""
        result = await self.db.execute(
            select(ProjectMember)
            .where(ProjectMember.project_id == project_id)
            .order_by(ProjectMember.joined_at)
        )
        return list(result.scalars().all())

    async def get_members_with_users(self, project_id: UUID) -> list[dict]:
        """Get all members of a project with user details"""
        from app.modules.users.models import User

        result = await self.db.execute(
            select(ProjectMember, User.email, User.name)
            .join(User, ProjectMember.user_id == User.id)
            .where(ProjectMember.project_id == project_id)
            .order_by(ProjectMember.joined_at)
        )

        members = []
        for row in result.all():
            member = row[0]
            user_email = row[1]
            user_name = row[2]
            members.append({
                "project_id": member.project_id,
                "user_id": member.user_id,
                "role": member.role,
                "joined_at": member.joined_at,
                "user_email": user_email,
                "user_name": user_name,
            })

        return members

    async def get_member(self, project_id: UUID, user_id: UUID) -> ProjectMember | None:
        """Get a specific project member"""
        result = await self.db.execute(
            select(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def add_member(
        self, project_id: UUID, data: ProjectMemberCreate
    ) -> ProjectMember | None:
        """Add a member to a project (idempotent)"""
        # Check if already a member
        existing = await self.get_member(project_id, data.user_id)
        if existing:
            return existing

        member = ProjectMember(
            project_id=project_id,
            user_id=data.user_id,
            role=data.role.value if isinstance(data.role, ProjectMemberRole) else data.role,
        )
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def update_member_role(
        self, project_id: UUID, user_id: UUID, role: ProjectMemberRole
    ) -> ProjectMember | None:
        """Update a member's role"""
        member = await self.get_member(project_id, user_id)
        if not member:
            return None

        member.role = role.value if isinstance(role, ProjectMemberRole) else role
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def remove_member(self, project_id: UUID, user_id: UUID) -> bool:
        """Remove a member from a project"""
        result = await self.db.execute(
            delete(ProjectMember).where(
                ProjectMember.project_id == project_id,
                ProjectMember.user_id == user_id,
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def is_member(self, project_id: UUID, user_id: UUID) -> bool:
        """Check if user is a member of the project"""
        member = await self.get_member(project_id, user_id)
        return member is not None

    async def has_role(
        self, project_id: UUID, user_id: UUID, roles: list[ProjectMemberRole]
    ) -> bool:
        """Check if user has one of the specified roles in the project"""
        member = await self.get_member(project_id, user_id)
        if not member:
            return False
        role_values = [r.value for r in roles]
        return member.role in role_values

    # ============================================================
    # Project Tasks & Boards
    # ============================================================

    async def get_project_tasks(
        self,
        project_id: UUID,
        status: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list, int]:
        """Get all tasks for a project"""
        from app.modules.tasks.models import Task

        query = select(Task).where(
            Task.project_id == project_id,
            Task.is_deleted == False,
        )

        if status:
            query = query.where(Task.status == status)

        # Count total
        count_query = select(func.count()).select_from(query.subquery())
        total = await self.db.execute(count_query)
        total_count = total.scalar() or 0

        # Get tasks with pagination
        query = query.order_by(Task.created_at.desc()).offset(skip).limit(limit)
        result = await self.db.execute(query)
        tasks = list(result.scalars().all())

        return tasks, total_count

    async def get_project_boards(self, project_id: UUID) -> list:
        """Get all boards for a project"""
        from app.modules.boards.models import Board

        result = await self.db.execute(
            select(Board).where(
                Board.project_id == project_id,
                Board.is_archived == False,
            ).order_by(Board.created_at.desc())
        )
        return list(result.scalars().all())
