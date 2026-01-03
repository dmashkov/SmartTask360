"""
SmartTask360 — Task History service (business logic)
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.task_history.models import TaskHistory
from app.modules.task_history.schemas import (
    TaskHistoryCreate,
    TaskHistoryFilter,
    TaskHistorySummary,
)


class TaskHistoryService:
    """Service for task history operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_entry(self, entry_data: TaskHistoryCreate) -> TaskHistory:
        """Create a new history entry"""
        entry = TaskHistory(
            task_id=entry_data.task_id,
            changed_by_id=entry_data.changed_by_id,
            action=entry_data.action,
            field_name=entry_data.field_name,
            old_value=entry_data.old_value,
            new_value=entry_data.new_value,
            comment=entry_data.comment,
            extra_data=entry_data.extra_data,
        )

        self.db.add(entry)
        await self.db.commit()
        await self.db.refresh(entry)
        return entry

    async def log_task_created(
        self, task_id: UUID, created_by_id: UUID, task_data: dict[str, Any]
    ) -> TaskHistory:
        """Log task creation"""
        return await self.create_entry(
            TaskHistoryCreate(
                task_id=task_id,
                changed_by_id=created_by_id,
                action="created",
                new_value=task_data,
                comment="Task created",
            )
        )

    async def log_field_change(
        self,
        task_id: UUID,
        changed_by_id: UUID,
        field_name: str,
        old_value: Any,
        new_value: Any,
        comment: str | None = None,
    ) -> TaskHistory:
        """Log a field change"""
        return await self.create_entry(
            TaskHistoryCreate(
                task_id=task_id,
                changed_by_id=changed_by_id,
                action="updated",
                field_name=field_name,
                old_value={"value": old_value} if old_value is not None else None,
                new_value={"value": new_value} if new_value is not None else None,
                comment=comment or f"Changed {field_name}",
            )
        )

    async def log_status_change(
        self,
        task_id: UUID,
        changed_by_id: UUID,
        old_status: str,
        new_status: str,
        comment: str | None = None,
    ) -> TaskHistory:
        """Log status change"""
        return await self.create_entry(
            TaskHistoryCreate(
                task_id=task_id,
                changed_by_id=changed_by_id,
                action="status_changed",
                field_name="status",
                old_value={"value": old_status},
                new_value={"value": new_status},
                comment=comment or f"Status changed from {old_status} to {new_status}",
            )
        )

    async def log_assignment(
        self,
        task_id: UUID,
        changed_by_id: UUID,
        old_assignee_id: UUID | None,
        new_assignee_id: UUID | None,
        comment: str | None = None,
    ) -> TaskHistory:
        """Log assignment change"""
        return await self.create_entry(
            TaskHistoryCreate(
                task_id=task_id,
                changed_by_id=changed_by_id,
                action="assigned",
                field_name="assignee_id",
                old_value={"value": str(old_assignee_id)} if old_assignee_id else None,
                new_value={"value": str(new_assignee_id)} if new_assignee_id else None,
                comment=comment or "Assignment changed",
            )
        )

    async def log_custom_action(
        self,
        task_id: UUID,
        changed_by_id: UUID,
        action: str,
        comment: str,
        extra_data: dict[str, Any] | None = None,
    ) -> TaskHistory:
        """Log a custom action"""
        return await self.create_entry(
            TaskHistoryCreate(
                task_id=task_id,
                changed_by_id=changed_by_id,
                action=action,
                comment=comment,
                extra_data=extra_data,
            )
        )

    async def get_task_history(
        self,
        task_id: UUID,
        filters: TaskHistoryFilter | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[TaskHistory]:
        """Get history entries for a task with optional filters"""
        query = select(TaskHistory).where(TaskHistory.task_id == task_id)

        if filters:
            if filters.action:
                query = query.where(TaskHistory.action == filters.action)
            if filters.field_name:
                query = query.where(TaskHistory.field_name == filters.field_name)
            if filters.changed_by_id:
                query = query.where(TaskHistory.changed_by_id == filters.changed_by_id)
            if filters.date_from:
                query = query.where(TaskHistory.created_at >= filters.date_from)
            if filters.date_to:
                query = query.where(TaskHistory.created_at <= filters.date_to)

        query = query.order_by(TaskHistory.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_user_activity(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[TaskHistory]:
        """Get all history entries made by a specific user"""
        result = await self.db.execute(
            select(TaskHistory)
            .where(TaskHistory.changed_by_id == user_id)
            .order_by(TaskHistory.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_recent_changes(
        self, limit: int = 50, task_ids: list[UUID] | None = None
    ) -> list[TaskHistory]:
        """Get recent changes across all tasks or specific tasks"""
        query = select(TaskHistory)

        if task_ids:
            query = query.where(TaskHistory.task_id.in_(task_ids))

        query = query.order_by(TaskHistory.created_at.desc()).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_task_summary(self, task_id: UUID) -> TaskHistorySummary:
        """Get summary statistics for task history"""
        # Get total count and date range
        stats_query = select(
            func.count(TaskHistory.id).label("total"),
            func.min(TaskHistory.created_at).label("first"),
            func.max(TaskHistory.created_at).label("last"),
            func.count(distinct(TaskHistory.changed_by_id)).label("unique_users"),
        ).where(TaskHistory.task_id == task_id)

        stats_result = await self.db.execute(stats_query)
        stats = stats_result.one()

        # Get action counts
        actions_query = select(
            TaskHistory.action, func.count(TaskHistory.id).label("count")
        ).where(TaskHistory.task_id == task_id).group_by(TaskHistory.action)

        actions_result = await self.db.execute(actions_query)
        actions = {row.action: row.count for row in actions_result.all()}

        return TaskHistorySummary(
            task_id=task_id,
            total_changes=stats.total or 0,
            unique_users=stats.unique_users or 0,
            actions=actions,
            first_change=stats.first,
            last_change=stats.last,
        )

    async def delete_task_history(self, task_id: UUID) -> int:
        """Delete all history entries for a task (returns number of deleted entries)"""
        result = await self.db.execute(
            select(TaskHistory).where(TaskHistory.task_id == task_id)
        )
        entries = result.scalars().all()
        count = len(entries)

        for entry in entries:
            await self.db.delete(entry)

        await self.db.commit()
        return count
