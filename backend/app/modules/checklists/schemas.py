"""
SmartTask360 — Checklist schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# Checklist schemas
class ChecklistCreate(BaseModel):
    """Schema for creating a checklist"""

    task_id: UUID
    title: str = Field(..., min_length=1, max_length=200)
    position: int = Field(default=0, ge=0)


class ChecklistUpdate(BaseModel):
    """Schema for updating a checklist"""

    title: str = Field(..., min_length=1, max_length=200)
    position: int = Field(default=0, ge=0)


class ChecklistResponse(BaseModel):
    """Schema for checklist response (without items)"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    title: str
    position: int
    created_at: datetime
    updated_at: datetime


# Checklist Item schemas
class ChecklistItemCreate(BaseModel):
    """Schema for creating a checklist item"""

    checklist_id: UUID
    parent_id: UUID | None = None
    content: str = Field(..., min_length=1)
    position: int = Field(default=0, ge=0)


class ChecklistItemUpdate(BaseModel):
    """Schema for updating a checklist item"""

    content: str = Field(..., min_length=1)
    position: int = Field(default=0, ge=0)


class ChecklistItemToggle(BaseModel):
    """Schema for toggling item completion status"""

    is_completed: bool


class ChecklistItemMove(BaseModel):
    """Schema for moving item to new parent"""

    new_parent_id: UUID | None = None
    new_position: int = Field(default=0, ge=0)


class ChecklistItemResponse(BaseModel):
    """Schema for checklist item response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    checklist_id: UUID
    parent_id: UUID | None
    path: str
    depth: int
    content: str
    is_completed: bool
    position: int
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class ChecklistWithItemsResponse(BaseModel):
    """Schema for checklist with all its items"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    title: str
    position: int
    created_at: datetime
    updated_at: datetime
    items: list[ChecklistItemResponse]


class ChecklistStatsResponse(BaseModel):
    """Schema for checklist completion statistics"""

    checklist_id: UUID
    total_items: int
    completed_items: int
    completion_percentage: float
