"""
SmartTask360 — Gantt Chart Service

Business logic for task dependencies, baselines, and critical path calculation.
"""

from collections import defaultdict
from datetime import datetime, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import and_, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.gantt.models import TaskBaseline, TaskDependency
from app.modules.gantt.schemas import (
    DependencyType,
    GanttDateUpdate,
    GanttResponse,
    GanttTaskData,
    TaskBaselineCreate,
    TaskBaselineResponse,
    TaskDependencyBrief,
    TaskDependencyCreate,
    TaskDependencyResponse,
)
from app.modules.tasks.models import Task
from app.modules.users.models import User


class GanttService:
    """Service for Gantt chart operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ============== Dependencies ==============

    async def create_dependency(
        self, data: TaskDependencyCreate, user_id: UUID
    ) -> TaskDependencyResponse:
        """Create a new task dependency"""
        # Validate tasks exist
        predecessor = await self.db.get(Task, data.predecessor_id)
        successor = await self.db.get(Task, data.successor_id)

        if not predecessor:
            raise ValueError(f"Predecessor task {data.predecessor_id} not found")
        if not successor:
            raise ValueError(f"Successor task {data.successor_id} not found")

        # Check for circular dependency
        if await self._would_create_cycle(data.predecessor_id, data.successor_id):
            raise ValueError("This dependency would create a circular reference")

        dependency = TaskDependency(
            predecessor_id=data.predecessor_id,
            successor_id=data.successor_id,
            dependency_type=data.dependency_type.value,
            lag_days=data.lag_days,
            created_by=user_id,
        )

        self.db.add(dependency)
        await self.db.commit()
        await self.db.refresh(dependency)

        return TaskDependencyResponse.model_validate(dependency)

    async def delete_dependency(
        self, predecessor_id: UUID, successor_id: UUID
    ) -> bool:
        """Delete a task dependency"""
        stmt = delete(TaskDependency).where(
            and_(
                TaskDependency.predecessor_id == predecessor_id,
                TaskDependency.successor_id == successor_id,
            )
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount > 0

    async def get_task_dependencies(
        self, task_id: UUID
    ) -> list[TaskDependencyResponse]:
        """Get all dependencies where task is predecessor or successor"""
        stmt = select(TaskDependency).where(
            (TaskDependency.predecessor_id == task_id)
            | (TaskDependency.successor_id == task_id)
        )
        result = await self.db.execute(stmt)
        dependencies = result.scalars().all()
        return [TaskDependencyResponse.model_validate(d) for d in dependencies]

    async def get_predecessors(self, task_id: UUID) -> list[TaskDependencyBrief]:
        """Get all predecessors of a task"""
        stmt = select(TaskDependency).where(TaskDependency.successor_id == task_id)
        result = await self.db.execute(stmt)
        dependencies = result.scalars().all()
        return [
            TaskDependencyBrief(
                predecessor_id=d.predecessor_id,
                dependency_type=d.dependency_type,
                lag_days=d.lag_days,
            )
            for d in dependencies
        ]

    async def _would_create_cycle(
        self, predecessor_id: UUID, successor_id: UUID
    ) -> bool:
        """Check if adding this dependency would create a cycle"""
        # Use BFS to check if successor can reach predecessor
        visited = set()
        queue = [successor_id]

        while queue:
            current = queue.pop(0)
            if current == predecessor_id:
                return True

            if current in visited:
                continue
            visited.add(current)

            # Get all successors of current task
            stmt = select(TaskDependency.successor_id).where(
                TaskDependency.predecessor_id == current
            )
            result = await self.db.execute(stmt)
            successors = result.scalars().all()
            queue.extend(successors)

        return False

    # ============== Baselines ==============

    async def create_baseline(
        self, data: TaskBaselineCreate, user_id: UUID
    ) -> TaskBaselineResponse:
        """Create a baseline snapshot for a task"""
        task = await self.db.get(Task, data.task_id)
        if not task:
            raise ValueError(f"Task {data.task_id} not found")

        # Get next baseline number for this task
        stmt = select(func.max(TaskBaseline.baseline_number)).where(
            TaskBaseline.task_id == data.task_id
        )
        result = await self.db.execute(stmt)
        max_number = result.scalar() or 0
        next_number = max_number + 1

        baseline = TaskBaseline(
            task_id=data.task_id,
            baseline_number=next_number,
            baseline_name=data.baseline_name,
            planned_start_date=task.planned_start_date,
            planned_end_date=task.planned_end_date,
            estimated_hours=task.estimated_hours,
            created_by=user_id,
        )

        self.db.add(baseline)
        await self.db.commit()
        await self.db.refresh(baseline)

        return TaskBaselineResponse.model_validate(baseline)

    async def create_bulk_baselines(
        self, task_ids: list[UUID], baseline_name: str | None, user_id: UUID
    ) -> list[TaskBaselineResponse]:
        """Create baselines for multiple tasks at once"""
        baselines = []
        for task_id in task_ids:
            try:
                baseline = await self.create_baseline(
                    TaskBaselineCreate(task_id=task_id, baseline_name=baseline_name),
                    user_id,
                )
                baselines.append(baseline)
            except ValueError:
                # Skip tasks that don't exist
                continue
        return baselines

    async def get_task_baselines(self, task_id: UUID) -> list[TaskBaselineResponse]:
        """Get all baselines for a task"""
        stmt = (
            select(TaskBaseline)
            .where(TaskBaseline.task_id == task_id)
            .order_by(TaskBaseline.baseline_number)
        )
        result = await self.db.execute(stmt)
        baselines = result.scalars().all()
        return [TaskBaselineResponse.model_validate(b) for b in baselines]

    async def delete_baseline(self, baseline_id: UUID) -> bool:
        """Delete a baseline"""
        baseline = await self.db.get(TaskBaseline, baseline_id)
        if not baseline:
            return False
        await self.db.delete(baseline)
        await self.db.commit()
        return True

    # ============== Gantt Data ==============

    async def get_gantt_data(self, project_id: UUID) -> GanttResponse:
        """Get Gantt chart data for a project"""
        # Get all tasks for project
        stmt = (
            select(Task)
            .where(
                and_(
                    Task.project_id == project_id,
                    Task.is_deleted == False,
                )
            )
            .order_by(Task.path)
        )
        result = await self.db.execute(stmt)
        tasks = result.scalars().all()

        if not tasks:
            return GanttResponse(
                tasks=[],
                project_id=project_id,
                min_date=None,
                max_date=None,
                critical_path=[],
            )

        # Get all task IDs
        task_ids = [t.id for t in tasks]

        # Get dependencies for all tasks
        deps_stmt = select(TaskDependency).where(
            TaskDependency.successor_id.in_(task_ids)
        )
        deps_result = await self.db.execute(deps_stmt)
        all_deps = deps_result.scalars().all()

        # Group dependencies by successor
        deps_by_successor: dict[UUID, list[TaskDependencyBrief]] = defaultdict(list)
        for dep in all_deps:
            deps_by_successor[dep.successor_id].append(
                TaskDependencyBrief(
                    predecessor_id=dep.predecessor_id,
                    dependency_type=dep.dependency_type,
                    lag_days=dep.lag_days,
                )
            )

        # Get assignee names
        assignee_ids = [t.assignee_id for t in tasks if t.assignee_id]
        assignee_names: dict[UUID, str] = {}
        if assignee_ids:
            users_stmt = select(User).where(User.id.in_(assignee_ids))
            users_result = await self.db.execute(users_stmt)
            users = users_result.scalars().all()
            assignee_names = {u.id: u.name for u in users}

        # Calculate critical path
        critical_path = await self._calculate_critical_path(tasks, all_deps)
        critical_set = set(critical_path)

        # Build Gantt task data
        gantt_tasks = []
        min_date = None
        max_date = None

        for task in tasks:
            # Calculate effective dates
            start_date = self._get_effective_start(task)
            end_date = self._get_effective_end(task)

            # Track min/max dates
            if start_date:
                if min_date is None or start_date < min_date:
                    min_date = start_date
            if end_date:
                if max_date is None or end_date > max_date:
                    max_date = end_date

            # Calculate progress
            progress = self._calculate_progress(task)

            gantt_task = GanttTaskData(
                id=task.id,
                title=task.title,
                status=task.status,
                priority=task.priority,
                start_date=start_date,
                end_date=end_date,
                planned_start_date=task.planned_start_date,
                planned_end_date=task.planned_end_date,
                due_date=task.due_date,
                started_at=task.started_at,
                completed_at=task.completed_at,
                is_milestone=task.is_milestone,
                estimated_hours=task.estimated_hours,
                progress=progress,
                parent_id=task.parent_id,
                depth=task.depth,
                dependencies=deps_by_successor.get(task.id, []),
                is_critical=task.id in critical_set,
                assignee_id=task.assignee_id,
                assignee_name=assignee_names.get(task.assignee_id)
                if task.assignee_id
                else None,
            )
            gantt_tasks.append(gantt_task)

        return GanttResponse(
            tasks=gantt_tasks,
            project_id=project_id,
            min_date=min_date,
            max_date=max_date,
            critical_path=critical_path,
        )

    def _get_effective_start(self, task: Task) -> datetime | None:
        """Get effective start date for Gantt display"""
        # Priority: planned_start_date > started_at > created_at
        if task.planned_start_date:
            return task.planned_start_date
        if task.started_at:
            return task.started_at
        # Fallback to created_at only if we have an end date
        if task.planned_end_date or task.due_date:
            return task.created_at
        return None

    def _get_effective_end(self, task: Task) -> datetime | None:
        """Get effective end date for Gantt display"""
        # Priority: planned_end_date > due_date > completed_at
        if task.planned_end_date:
            return task.planned_end_date
        if task.due_date:
            return task.due_date
        if task.completed_at:
            return task.completed_at
        # Calculate from estimated hours if we have a start
        start = self._get_effective_start(task)
        if start and task.estimated_hours:
            # Assume 8 hours per day
            days = int(task.estimated_hours / 8) or 1
            return start + timedelta(days=days)
        return None

    def _calculate_progress(self, task: Task) -> int:
        """Calculate task progress percentage"""
        if task.status == "done" or task.completed_at:
            return 100
        if task.status == "new":
            return 0
        if task.status in ("in_progress", "review"):
            # Could be enhanced with actual tracking later
            if task.status == "review":
                return 80
            return 50
        return 0

    # ============== Critical Path Method (CPM) ==============

    async def _calculate_critical_path(
        self, tasks: list[Task], dependencies: list[TaskDependency]
    ) -> list[UUID]:
        """
        Calculate critical path using CPM algorithm.

        The critical path is the longest path through the project,
        determining the minimum project duration.
        """
        if not tasks:
            return []

        # Build task lookup and duration map
        task_map = {t.id: t for t in tasks}
        task_ids = set(task_map.keys())

        # Calculate duration for each task (in days)
        durations: dict[UUID, int] = {}
        for task in tasks:
            if task.is_milestone:
                durations[task.id] = 0
            elif task.estimated_hours:
                # Assume 8 hours per day
                durations[task.id] = max(1, int(task.estimated_hours / 8))
            else:
                # Default duration
                start = self._get_effective_start(task)
                end = self._get_effective_end(task)
                if start and end:
                    durations[task.id] = max(1, (end - start).days)
                else:
                    durations[task.id] = 1

        # Build dependency graph
        predecessors: dict[UUID, list[tuple[UUID, str, int]]] = defaultdict(list)
        successors: dict[UUID, list[tuple[UUID, str, int]]] = defaultdict(list)

        for dep in dependencies:
            if dep.predecessor_id in task_ids and dep.successor_id in task_ids:
                predecessors[dep.successor_id].append(
                    (dep.predecessor_id, dep.dependency_type, dep.lag_days)
                )
                successors[dep.predecessor_id].append(
                    (dep.successor_id, dep.dependency_type, dep.lag_days)
                )

        # Forward pass - calculate earliest start (ES) and earliest finish (EF)
        es: dict[UUID, int] = {}  # Earliest start
        ef: dict[UUID, int] = {}  # Earliest finish

        # Find tasks with no predecessors (start tasks)
        start_tasks = [t.id for t in tasks if t.id not in predecessors]

        # Topological sort for forward pass
        visited = set()
        order = []

        def visit(task_id: UUID):
            if task_id in visited:
                return
            visited.add(task_id)
            for succ_id, _, _ in successors.get(task_id, []):
                if succ_id in task_ids:
                    visit(succ_id)
            order.append(task_id)

        for start in start_tasks:
            visit(start)
        order.reverse()

        # Calculate ES and EF
        for task_id in order:
            if task_id not in predecessors:
                es[task_id] = 0
            else:
                max_ef = 0
                for pred_id, dep_type, lag in predecessors[task_id]:
                    if pred_id not in ef:
                        continue
                    if dep_type == "FS":
                        # Finish-to-Start: successor starts after predecessor finishes
                        max_ef = max(max_ef, ef[pred_id] + lag)
                    elif dep_type == "SS":
                        # Start-to-Start: both start together (plus lag)
                        max_ef = max(max_ef, es.get(pred_id, 0) + lag)
                    elif dep_type == "FF":
                        # Finish-to-Finish: both finish together
                        max_ef = max(max_ef, ef[pred_id] - durations[task_id] + lag)
                    elif dep_type == "SF":
                        # Start-to-Finish: successor finishes when predecessor starts
                        max_ef = max(
                            max_ef, es.get(pred_id, 0) - durations[task_id] + lag
                        )
                es[task_id] = max(0, max_ef)
            ef[task_id] = es[task_id] + durations[task_id]

        # Find project duration
        project_duration = max(ef.values()) if ef else 0

        # Backward pass - calculate latest start (LS) and latest finish (LF)
        ls: dict[UUID, int] = {}  # Latest start
        lf: dict[UUID, int] = {}  # Latest finish

        # Find tasks with no successors (end tasks)
        end_tasks = [t.id for t in tasks if t.id not in successors]

        # Calculate LS and LF (reverse order)
        for task_id in reversed(order):
            if task_id not in successors or task_id in end_tasks:
                lf[task_id] = project_duration
            else:
                min_ls = project_duration
                for succ_id, dep_type, lag in successors[task_id]:
                    if succ_id not in ls:
                        continue
                    if dep_type == "FS":
                        min_ls = min(min_ls, ls[succ_id] - lag)
                    elif dep_type == "SS":
                        min_ls = min(min_ls, ls[succ_id] + durations[task_id] - lag)
                    elif dep_type == "FF":
                        min_ls = min(min_ls, lf[succ_id] - lag)
                    elif dep_type == "SF":
                        min_ls = min(min_ls, lf[succ_id] + durations[task_id] - lag)
                lf[task_id] = min_ls
            ls[task_id] = lf[task_id] - durations[task_id]

        # Calculate float (slack) and identify critical path
        # Critical tasks have zero float (ES == LS)
        critical_tasks = []
        for task_id in order:
            if task_id in es and task_id in ls:
                slack = ls[task_id] - es[task_id]
                if slack == 0:
                    critical_tasks.append(task_id)

        return critical_tasks

    # ============== Date Updates ==============

    async def update_task_dates(
        self, task_id: UUID, data: GanttDateUpdate
    ) -> Task | None:
        """Update task planned dates (from Gantt drag/resize)"""
        task = await self.db.get(Task, task_id)
        if not task:
            return None

        if data.planned_start_date is not None:
            task.planned_start_date = data.planned_start_date
        if data.planned_end_date is not None:
            task.planned_end_date = data.planned_end_date

        task.updated_at = datetime.utcnow()
        await self.db.commit()
        await self.db.refresh(task)
        return task
