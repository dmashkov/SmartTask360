"""
SmartTask360 — Notification service (business logic)
"""

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import delete as sql_delete
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.types import NotificationPriority, NotificationType
from app.modules.notifications.models import Notification, NotificationSettings
from app.modules.notifications.schemas import (
    NotificationCreate,
    NotificationSettingsUpdate,
    UnreadCount,
)


class NotificationService:
    """Service for notification operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # =========================================================================
    # Notification CRUD
    # =========================================================================

    async def get_notification_by_id(self, notification_id: UUID) -> Notification | None:
        """Get notification by ID"""
        result = await self.db.execute(
            select(Notification).where(Notification.id == notification_id)
        )
        return result.scalar_one_or_none()

    async def get_notifications_for_user(
        self,
        user_id: UUID,
        unread_only: bool = False,
        notification_type: NotificationType | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> list[Notification]:
        """Get notifications for user with optional filters"""
        query = select(Notification).where(Notification.user_id == user_id)

        if unread_only:
            query = query.where(Notification.is_read == False)

        if notification_type:
            query = query.where(Notification.type == notification_type.value)

        if entity_type:
            query = query.where(Notification.entity_type == entity_type)

        if entity_id:
            query = query.where(Notification.entity_id == entity_id)

        query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create_notification(self, data: NotificationCreate) -> Notification:
        """Create a new notification"""
        # Check if user has this notification type enabled
        settings = await self.get_or_create_settings(data.user_id)
        if not self._is_notification_enabled(settings, data.type):
            # Still create but can be used for filtering in UI
            pass

        notification = Notification(
            user_id=data.user_id,
            type=data.type.value,
            title=data.title,
            content=data.content,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            actor_id=data.actor_id,
            priority=data.priority.value,
            group_key=data.group_key,
            extra_data=data.extra_data,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)
        return notification

    async def send(
        self,
        user_id: UUID,
        notification_type: NotificationType,
        title: str,
        content: str | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        actor_id: UUID | None = None,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        group_key: str | None = None,
        extra_data: dict | None = None,
    ) -> Notification | None:
        """
        Send a notification to a user.
        Checks user settings before sending.
        Returns None if notification is disabled for user.
        """
        # Check settings
        settings = await self.get_or_create_settings(user_id)
        if not self._is_notification_enabled(settings, notification_type):
            return None

        notification = Notification(
            user_id=user_id,
            type=notification_type.value,
            title=title,
            content=content,
            entity_type=entity_type,
            entity_id=entity_id,
            actor_id=actor_id,
            priority=priority.value,
            group_key=group_key,
            extra_data=extra_data,
        )
        self.db.add(notification)
        await self.db.commit()
        await self.db.refresh(notification)

        # TODO: Send email if email_enabled and email_digest == "instant"
        # TODO: Send push notification if push_enabled

        return notification

    async def send_bulk(
        self,
        user_ids: list[UUID],
        notification_type: NotificationType,
        title: str,
        content: str | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
        actor_id: UUID | None = None,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        group_key: str | None = None,
        extra_data: dict | None = None,
    ) -> list[Notification]:
        """
        Send notifications to multiple users.
        Returns list of created notifications (may be fewer than user_ids if disabled).
        """
        notifications = []

        for user_id in user_ids:
            notification = await self.send(
                user_id=user_id,
                notification_type=notification_type,
                title=title,
                content=content,
                entity_type=entity_type,
                entity_id=entity_id,
                actor_id=actor_id,
                priority=priority,
                group_key=group_key,
                extra_data=extra_data,
            )
            if notification:
                notifications.append(notification)

        return notifications

    async def mark_as_read(
        self, notification_ids: list[UUID], user_id: UUID
    ) -> int:
        """Mark notifications as read. Returns count of updated."""
        result = await self.db.execute(
            update(Notification)
            .where(Notification.id.in_(notification_ids))
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
            .values(is_read=True, read_at=datetime.utcnow())
        )
        await self.db.commit()
        return result.rowcount

    async def mark_all_as_read(
        self,
        user_id: UUID,
        notification_type: NotificationType | None = None,
        entity_type: str | None = None,
        entity_id: UUID | None = None,
    ) -> int:
        """Mark all matching notifications as read. Returns count of updated."""
        query = (
            update(Notification)
            .where(Notification.user_id == user_id)
            .where(Notification.is_read == False)
        )

        if notification_type:
            query = query.where(Notification.type == notification_type.value)

        if entity_type:
            query = query.where(Notification.entity_type == entity_type)

        if entity_id:
            query = query.where(Notification.entity_id == entity_id)

        query = query.values(is_read=True, read_at=datetime.utcnow())

        result = await self.db.execute(query)
        await self.db.commit()
        return result.rowcount

    async def delete_notification(
        self, notification_id: UUID, user_id: UUID
    ) -> bool:
        """Delete a notification (only own notifications)"""
        result = await self.db.execute(
            sql_delete(Notification).where(
                Notification.id == notification_id,
                Notification.user_id == user_id,
            )
        )
        await self.db.commit()
        return result.rowcount > 0

    async def delete_old_notifications(
        self, user_id: UUID, days: int = 30
    ) -> int:
        """Delete notifications older than specified days"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        result = await self.db.execute(
            sql_delete(Notification).where(
                Notification.user_id == user_id,
                Notification.created_at < cutoff,
            )
        )
        await self.db.commit()
        return result.rowcount

    async def get_unread_count(self, user_id: UUID) -> UnreadCount:
        """Get unread notification count with breakdown by type"""
        # Total unread
        total_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
        )
        total = total_result.scalar() or 0

        # By type
        by_type_result = await self.db.execute(
            select(Notification.type, func.count(Notification.id))
            .where(
                Notification.user_id == user_id,
                Notification.is_read == False,
            )
            .group_by(Notification.type)
        )
        by_type = {row[0]: row[1] for row in by_type_result.all()}

        # High priority
        high_priority_result = await self.db.execute(
            select(func.count(Notification.id)).where(
                Notification.user_id == user_id,
                Notification.is_read == False,
                Notification.priority.in_(["high", "urgent"]),
            )
        )
        high_priority = high_priority_result.scalar() or 0

        return UnreadCount(
            total=total,
            by_type=by_type,
            high_priority=high_priority,
        )

    # =========================================================================
    # Settings Management
    # =========================================================================

    async def get_settings(self, user_id: UUID) -> NotificationSettings | None:
        """Get notification settings for user"""
        result = await self.db.execute(
            select(NotificationSettings).where(
                NotificationSettings.user_id == user_id
            )
        )
        return result.scalar_one_or_none()

    async def get_or_create_settings(self, user_id: UUID) -> NotificationSettings:
        """Get or create notification settings for user"""
        settings = await self.get_settings(user_id)
        if not settings:
            settings = NotificationSettings(user_id=user_id)
            self.db.add(settings)
            await self.db.commit()
            await self.db.refresh(settings)
        return settings

    async def update_settings(
        self, user_id: UUID, data: NotificationSettingsUpdate
    ) -> NotificationSettings:
        """Update notification settings"""
        settings = await self.get_or_create_settings(user_id)

        update_data = data.model_dump(exclude_unset=True)

        # Convert enums to values
        if "email_digest" in update_data and update_data["email_digest"] is not None:
            update_data["email_digest"] = update_data["email_digest"].value

        for field, value in update_data.items():
            setattr(settings, field, value)

        await self.db.commit()
        await self.db.refresh(settings)
        return settings

    # =========================================================================
    # Helper Methods
    # =========================================================================

    def _is_notification_enabled(
        self, settings: NotificationSettings, notification_type: NotificationType
    ) -> bool:
        """Check if notification type is enabled in user settings"""
        mapping = {
            NotificationType.TASK_ASSIGNED: settings.notify_task_assigned,
            NotificationType.TASK_COMMENT: settings.notify_task_comment,
            NotificationType.TASK_MENTION: settings.notify_task_mention,
            NotificationType.TASK_STATUS_CHANGED: settings.notify_task_status_changed,
            NotificationType.TASK_DUE_SOON: settings.notify_task_due_soon,
            NotificationType.TASK_OVERDUE: settings.notify_task_overdue,
            NotificationType.TASK_ACCEPTED: settings.notify_task_accepted,
            NotificationType.TASK_REJECTED: settings.notify_task_rejected,
            NotificationType.CHECKLIST_ASSIGNED: settings.notify_checklist_assigned,
            NotificationType.CHECKLIST_COMPLETED: settings.notify_checklist_completed,
            NotificationType.AI_VALIDATION_COMPLETE: settings.notify_ai_validation_complete,
            NotificationType.BOARD_TASK_MOVED: settings.notify_board_task_moved,
        }
        return mapping.get(notification_type, True)

    # =========================================================================
    # Convenience Methods for Common Notifications
    # =========================================================================

    async def notify_task_assigned(
        self,
        assignee_id: UUID,
        task_id: UUID,
        task_title: str,
        assigner_id: UUID,
    ) -> Notification | None:
        """Send notification when task is assigned"""
        return await self.send(
            user_id=assignee_id,
            notification_type=NotificationType.TASK_ASSIGNED,
            title=f"Вам назначена задача: {task_title}",
            entity_type="task",
            entity_id=task_id,
            actor_id=assigner_id,
            priority=NotificationPriority.HIGH,
            group_key=f"task_assigned:{task_id}",
            extra_data={"task_title": task_title},
        )

    async def notify_task_comment(
        self,
        user_ids: list[UUID],
        task_id: UUID,
        task_title: str,
        comment_preview: str,
        commenter_id: UUID,
    ) -> list[Notification]:
        """Send notification when someone comments on a task"""
        return await self.send_bulk(
            user_ids=[u for u in user_ids if u != commenter_id],  # Don't notify author
            notification_type=NotificationType.TASK_COMMENT,
            title=f"Новый комментарий к задаче: {task_title}",
            content=comment_preview[:200],
            entity_type="task",
            entity_id=task_id,
            actor_id=commenter_id,
            group_key=f"task_comment:{task_id}",
            extra_data={"task_title": task_title},
        )

    async def notify_task_mention(
        self,
        mentioned_user_id: UUID,
        task_id: UUID,
        task_title: str,
        mentioner_id: UUID,
        context: str,
    ) -> Notification | None:
        """Send notification when user is mentioned"""
        return await self.send(
            user_id=mentioned_user_id,
            notification_type=NotificationType.TASK_MENTION,
            title=f"Вас упомянули в задаче: {task_title}",
            content=context[:200],
            entity_type="task",
            entity_id=task_id,
            actor_id=mentioner_id,
            priority=NotificationPriority.HIGH,
            extra_data={"task_title": task_title},
        )

    async def notify_task_status_changed(
        self,
        user_ids: list[UUID],
        task_id: UUID,
        task_title: str,
        old_status: str,
        new_status: str,
        changer_id: UUID,
    ) -> list[Notification]:
        """Send notification when task status changes"""
        return await self.send_bulk(
            user_ids=[u for u in user_ids if u != changer_id],
            notification_type=NotificationType.TASK_STATUS_CHANGED,
            title=f"Статус задачи изменён: {task_title}",
            content=f"{old_status} → {new_status}",
            entity_type="task",
            entity_id=task_id,
            actor_id=changer_id,
            extra_data={
                "task_title": task_title,
                "old_status": old_status,
                "new_status": new_status,
            },
        )

    async def notify_task_due_soon(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        due_date: datetime,
    ) -> Notification | None:
        """Send notification when task is due soon"""
        return await self.send(
            user_id=user_id,
            notification_type=NotificationType.TASK_DUE_SOON,
            title=f"Срок задачи скоро истекает: {task_title}",
            content=f"Дедлайн: {due_date.strftime('%d.%m.%Y %H:%M')}",
            entity_type="task",
            entity_id=task_id,
            priority=NotificationPriority.HIGH,
            extra_data={"task_title": task_title, "due_date": due_date.isoformat()},
        )

    async def notify_task_overdue(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        due_date: datetime,
    ) -> Notification | None:
        """Send notification when task is overdue"""
        return await self.send(
            user_id=user_id,
            notification_type=NotificationType.TASK_OVERDUE,
            title=f"Задача просрочена: {task_title}",
            content=f"Дедлайн был: {due_date.strftime('%d.%m.%Y %H:%M')}",
            entity_type="task",
            entity_id=task_id,
            priority=NotificationPriority.URGENT,
            extra_data={"task_title": task_title, "due_date": due_date.isoformat()},
        )

    async def notify_ai_validation_complete(
        self,
        user_id: UUID,
        task_id: UUID,
        task_title: str,
        is_valid: bool,
        overall_score: float,
    ) -> Notification | None:
        """Send notification when AI validation completes"""
        status = "соответствует SMART" if is_valid else "требует доработки"
        return await self.send(
            user_id=user_id,
            notification_type=NotificationType.AI_VALIDATION_COMPLETE,
            title=f"SMART-валидация завершена: {task_title}",
            content=f"Результат: {status} (оценка: {overall_score:.2f})",
            entity_type="task",
            entity_id=task_id,
            extra_data={
                "task_title": task_title,
                "is_valid": is_valid,
                "score": overall_score,
            },
        )
