"""
SmartTask360 — Shared types and enums
"""

from enum import Enum


class UserRole(str, Enum):
    """User role enum (matches database VARCHAR(20))"""

    ADMIN = "admin"
    MANAGER = "manager"
    EXECUTOR = "executor"

    def __str__(self) -> str:
        return self.value


class TaskPriority(str, Enum):
    """Task priority enum (matches database VARCHAR(20))"""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    def __str__(self) -> str:
        return self.value


class TaskStatus(str, Enum):
    """
    Task status enum (matches database VARCHAR(50))

    Note: In production, statuses are configurable via task_status_config table.
    These are default values for MVP.
    """

    DRAFT = "draft"
    NEW = "new"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    ON_HOLD = "on_hold"
    IN_REVIEW = "in_review"
    DONE = "done"
    CANCELLED = "cancelled"

    def __str__(self) -> str:
        return self.value


class RejectionReason(str, Enum):
    """Reasons for task rejection by assignee (matches database VARCHAR(50))"""

    UNCLEAR = "unclear"
    NO_RESOURCES = "no_resources"
    UNREALISTIC_DEADLINE = "unrealistic_deadline"
    CONFLICT = "conflict"
    WRONG_ASSIGNEE = "wrong_assignee"
    OTHER = "other"

    def __str__(self) -> str:
        return self.value


class BoardMemberRole(str, Enum):
    """Board member role enum"""

    VIEWER = "viewer"
    MEMBER = "member"
    ADMIN = "admin"

    def __str__(self) -> str:
        return self.value


class NotificationType(str, Enum):
    """Notification type enum"""

    TASK_ASSIGNED = "task_assigned"
    TASK_COMMENT = "task_comment"
    TASK_MENTION = "task_mention"
    TASK_STATUS_CHANGED = "task_status_changed"
    TASK_DUE_SOON = "task_due_soon"
    TASK_OVERDUE = "task_overdue"
    TASK_ACCEPTED = "task_accepted"
    TASK_REJECTED = "task_rejected"
    CHECKLIST_ASSIGNED = "checklist_assigned"
    CHECKLIST_COMPLETED = "checklist_completed"
    AI_VALIDATION_COMPLETE = "ai_validation_complete"
    BOARD_TASK_MOVED = "board_task_moved"

    def __str__(self) -> str:
        return self.value


class NotificationPriority(str, Enum):
    """Notification priority enum"""

    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"

    def __str__(self) -> str:
        return self.value


class EmailDigest(str, Enum):
    """Email digest frequency"""

    INSTANT = "instant"
    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    DISABLED = "disabled"

    def __str__(self) -> str:
        return self.value
