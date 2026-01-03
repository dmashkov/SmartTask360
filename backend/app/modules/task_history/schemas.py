"""
SmartTask360 — Task History schemas (Pydantic)
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class TaskHistoryCreate(BaseModel):
    """Schema for creating a history entry"""

    task_id: UUID
    changed_by_id: UUID | None = None
    action: str
    field_name: str | None = None
    old_value: dict[str, Any] | None = None
    new_value: dict[str, Any] | None = None
    comment: str | None = None
    extra_data: dict[str, Any] | None = None


class TaskHistoryResponse(BaseModel):
    """Schema for history entry response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    changed_by_id: UUID | None
    action: str
    field_name: str | None
    old_value: dict[str, Any] | None
    new_value: dict[str, Any] | None
    comment: str | None
    extra_data: dict[str, Any] | None
    created_at: datetime


class TaskHistoryFilter(BaseModel):
    """Schema for filtering history entries"""

    action: str | None = None
    field_name: str | None = None
    changed_by_id: UUID | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None


class TaskHistorySummary(BaseModel):
    """Schema for history summary statistics"""

    task_id: UUID
    total_changes: int
    unique_users: int
    actions: dict[str, int]  # action -> count
    first_change: datetime | None
    last_change: datetime | None
