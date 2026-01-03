"""
SmartTask360 — Notification models
"""

from datetime import datetime, time
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, Time
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Notification(Base):
    """
    User notification - task events, mentions, deadlines, etc.

    Notifications can be grouped by group_key to show as single item
    (e.g., "5 new comments on task X").
    """

    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Recipient
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Notification type (see NotificationType enum)
    type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Content
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Related entity (for navigation)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # task, comment, checklist, etc.
    entity_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)

    # Actor (who triggered the notification)
    actor_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Status
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    # Priority (for sorting/filtering)
    priority: Mapped[str] = mapped_column(String(20), nullable=False, default="normal")  # low, normal, high, urgent

    # Group key for aggregation (e.g., "task_comment:{task_id}")
    group_key: Mapped[str | None] = mapped_column(String(200), nullable=True, index=True)

    # Extra data (JSONB for flexibility)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )
    read_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<Notification {self.type} for user={self.user_id}>"


class NotificationSettings(Base):
    """
    User notification preferences.

    Controls what notifications the user receives and how (in-app, email).
    """

    __tablename__ = "notification_settings"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # Task notifications
    notify_task_assigned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_comment: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_mention: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_status_changed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_due_soon: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_overdue: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_task_rejected: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Checklist notifications
    notify_checklist_assigned: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    notify_checklist_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # AI notifications
    notify_ai_validation_complete: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Board notifications
    notify_board_task_moved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Email settings
    email_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    email_digest: Mapped[str] = mapped_column(
        String(20), nullable=False, default="daily"
    )  # instant, hourly, daily, weekly, disabled

    # Quiet hours (do not disturb)
    quiet_hours_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    quiet_hours_start: Mapped[time | None] = mapped_column(Time, nullable=True)  # e.g., 22:00
    quiet_hours_end: Mapped[time | None] = mapped_column(Time, nullable=True)  # e.g., 08:00

    # Push notifications (for future mobile support)
    push_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<NotificationSettings for user={self.user_id}>"
