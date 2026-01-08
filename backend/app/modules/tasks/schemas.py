"""
SmartTask360 — Task schemas (Pydantic)
"""

from datetime import datetime
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.core.types import RejectionReason, TaskPriority, TaskStatus


class TaskCreate(BaseModel):
    """Schema for creating a task"""

    title: str = Field(..., min_length=1, max_length=500)
    description: str | None = None
    status: TaskStatus = TaskStatus.NEW
    priority: TaskPriority = TaskPriority.MEDIUM
    # creator_id - on whose behalf the task is created (defaults to current user)
    creator_id: UUID | None = None
    # assignee_id - who will execute (defaults to creator_id)
    assignee_id: UUID | None = None
    parent_id: UUID | None = None
    department_id: UUID | None = None
    project_id: UUID | None = None
    workflow_template_id: UUID | None = None
    source_document_id: UUID | None = None
    source_quote: str | None = None
    due_date: datetime | None = None
    is_milestone: bool = False
    estimated_hours: Decimal | None = None
    acceptance_deadline: datetime | None = None
    # Gantt Chart - planned dates
    planned_start_date: datetime | None = None
    planned_end_date: datetime | None = None


class TaskUpdate(BaseModel):
    """Schema for updating a task (all fields optional)"""

    title: str | None = Field(None, min_length=1, max_length=500)
    description: str | None = None
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    # creator_id can be changed (on whose behalf the task is)
    creator_id: UUID | None = None
    assignee_id: UUID | None = None
    parent_id: UUID | None = None
    department_id: UUID | None = None
    project_id: UUID | None = None
    workflow_template_id: UUID | None = None
    source_document_id: UUID | None = None
    source_quote: str | None = None
    due_date: datetime | None = None
    is_milestone: bool | None = None
    estimated_hours: Decimal | None = None
    actual_hours: Decimal | None = None
    acceptance_deadline: datetime | None = None
    # Gantt Chart - planned dates
    planned_start_date: datetime | None = None
    planned_end_date: datetime | None = None


class TaskResponse(BaseModel):
    """Schema for task response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    title: str
    description: str | None
    status: str
    priority: str
    # author_id - who physically created the task (immutable)
    author_id: UUID
    # creator_id - on whose behalf the task was created
    creator_id: UUID
    assignee_id: UUID | None
    parent_id: UUID | None
    path: str
    depth: int
    department_id: UUID | None
    project_id: UUID | None
    workflow_template_id: UUID | None
    source_document_id: UUID | None
    source_quote: str | None
    due_date: datetime | None
    started_at: datetime | None
    completed_at: datetime | None
    # Gantt Chart - planned dates
    planned_start_date: datetime | None
    planned_end_date: datetime | None
    is_milestone: bool
    is_deleted: bool
    estimated_hours: Decimal | None
    actual_hours: Decimal | None
    accepted_at: datetime | None
    acceptance_deadline: datetime | None
    rejection_reason: str | None = None
    rejection_comment: str | None = None
    completion_result: str | None = None
    kanban_position: int = 0
    smart_score: dict[str, Any] | None = None
    smart_validated_at: datetime | None
    smart_is_valid: bool | None
    children_count: int = 0
    tags: list["TagBrief"] = []
    created_at: datetime
    updated_at: datetime


class TaskAccept(BaseModel):
    """Schema for accepting a task"""

    comment: str | None = None


class TaskReject(BaseModel):
    """Schema for rejecting a task"""

    reason: RejectionReason
    comment: str = Field(..., min_length=1)


class TaskStatusChange(BaseModel):
    """Schema for changing task status"""

    status: TaskStatus
    comment: str | None = None


class TaskStatusChangeWorkflow(BaseModel):
    """Schema for changing task status with workflow validation"""

    new_status: str = Field(..., description="New status key")
    comment: str | None = None


class TaskWatcherRequest(BaseModel):
    """Schema for adding/removing watchers"""

    user_id: UUID


class TaskParticipantRequest(BaseModel):
    """Schema for adding/removing participants"""

    user_id: UUID


class AvailableTransitionsResponse(BaseModel):
    """Schema for available status transitions"""

    current_status: str
    available_statuses: list[str]


class UserBrief(BaseModel):
    """Brief user info for watchers/participants lists"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str


class TagBrief(BaseModel):
    """Brief tag info for task responses"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    color: str


class KanbanReorderRequest(BaseModel):
    """Request to update kanban positions for tasks in a status column"""

    # List of task IDs in desired order (top to bottom)
    task_ids: list[UUID]
    # The status column this order applies to
    status: TaskStatus
