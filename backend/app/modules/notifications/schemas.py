"""
SmartTask360 — Notification schemas (Pydantic validation)
"""

from datetime import datetime, time
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.types import EmailDigest, NotificationPriority, NotificationType


# ============================================================================
# Notification Schemas
# ============================================================================


class NotificationCreate(BaseModel):
    """Schema for creating a notification (internal use)"""

    user_id: UUID
    type: NotificationType
    title: str = Field(..., max_length=200)
    content: str | None = None
    entity_type: str | None = None
    entity_id: UUID | None = None
    actor_id: UUID | None = None
    priority: NotificationPriority = NotificationPriority.NORMAL
    group_key: str | None = None
    extra_data: dict | None = None


class NotificationResponse(BaseModel):
    """Schema for notification response"""

    id: UUID
    user_id: UUID
    type: str
    title: str
    content: str | None
    entity_type: str | None
    entity_id: UUID | None
    actor_id: UUID | None
    is_read: bool
    priority: str
    group_key: str | None
    extra_data: dict | None
    created_at: datetime
    read_at: datetime | None

    model_config = {"from_attributes": True}


class NotificationWithActor(BaseModel):
    """Schema for notification with actor details"""

    id: UUID
    user_id: UUID
    type: str
    title: str
    content: str | None
    entity_type: str | None
    entity_id: UUID | None
    actor_id: UUID | None
    is_read: bool
    priority: str
    group_key: str | None
    extra_data: dict | None
    created_at: datetime
    read_at: datetime | None

    # Actor details
    actor_name: str | None = None
    actor_email: str | None = None

    model_config = {"from_attributes": True}


class NotificationMarkRead(BaseModel):
    """Schema for marking notifications as read"""

    notification_ids: list[UUID] = Field(..., min_length=1)


class NotificationMarkAllRead(BaseModel):
    """Schema for marking all notifications as read (optional filters)"""

    type: NotificationType | None = None
    entity_type: str | None = None
    entity_id: UUID | None = None


class UnreadCount(BaseModel):
    """Schema for unread notification count"""

    total: int
    by_type: dict[str, int] = {}  # e.g., {"task_assigned": 5, "task_comment": 3}
    high_priority: int = 0


# ============================================================================
# Notification Settings Schemas
# ============================================================================


class NotificationSettingsUpdate(BaseModel):
    """Schema for updating notification settings"""

    # Task notifications
    notify_task_assigned: bool | None = None
    notify_task_comment: bool | None = None
    notify_task_mention: bool | None = None
    notify_task_status_changed: bool | None = None
    notify_task_due_soon: bool | None = None
    notify_task_overdue: bool | None = None
    notify_task_accepted: bool | None = None
    notify_task_rejected: bool | None = None

    # Checklist notifications
    notify_checklist_assigned: bool | None = None
    notify_checklist_completed: bool | None = None

    # AI notifications
    notify_ai_validation_complete: bool | None = None

    # Board notifications
    notify_board_task_moved: bool | None = None

    # Email settings
    email_enabled: bool | None = None
    email_digest: EmailDigest | None = None

    # Quiet hours
    quiet_hours_enabled: bool | None = None
    quiet_hours_start: time | None = None
    quiet_hours_end: time | None = None

    # Push notifications
    push_enabled: bool | None = None


class NotificationSettingsResponse(BaseModel):
    """Schema for notification settings response"""

    id: UUID
    user_id: UUID

    # Task notifications
    notify_task_assigned: bool
    notify_task_comment: bool
    notify_task_mention: bool
    notify_task_status_changed: bool
    notify_task_due_soon: bool
    notify_task_overdue: bool
    notify_task_accepted: bool
    notify_task_rejected: bool

    # Checklist notifications
    notify_checklist_assigned: bool
    notify_checklist_completed: bool

    # AI notifications
    notify_ai_validation_complete: bool

    # Board notifications
    notify_board_task_moved: bool

    # Email settings
    email_enabled: bool
    email_digest: str

    # Quiet hours
    quiet_hours_enabled: bool
    quiet_hours_start: time | None
    quiet_hours_end: time | None

    # Push notifications
    push_enabled: bool

    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# Notification Payload Builders (for internal use)
# ============================================================================


class TaskNotificationPayload(BaseModel):
    """Payload for task-related notifications"""

    task_id: UUID
    task_title: str
    project_id: UUID | None = None
    project_name: str | None = None


class CommentNotificationPayload(BaseModel):
    """Payload for comment-related notifications"""

    comment_id: UUID
    task_id: UUID
    task_title: str
    comment_preview: str  # First 100 chars of comment


class ChecklistNotificationPayload(BaseModel):
    """Payload for checklist-related notifications"""

    checklist_id: UUID
    checklist_title: str
    item_id: UUID | None = None
    item_title: str | None = None
    task_id: UUID
    task_title: str


class BoardNotificationPayload(BaseModel):
    """Payload for board-related notifications"""

    board_id: UUID
    board_name: str
    task_id: UUID
    task_title: str
    from_column: str | None = None
    to_column: str
    new_status: str | None = None
