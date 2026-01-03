"""
SmartTask360 — Tag schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TagCreate(BaseModel):
    """Schema for creating a tag"""

    name: str = Field(..., min_length=1, max_length=100)
    color: str = Field(default="#6B7280", pattern=r"^#[0-9A-Fa-f]{6}$")


class TagUpdate(BaseModel):
    """Schema for updating a tag (all fields optional)"""

    name: str | None = Field(None, min_length=1, max_length=100)
    color: str | None = Field(None, pattern=r"^#[0-9A-Fa-f]{6}$")
    is_active: bool | None = None


class TagResponse(BaseModel):
    """Schema for tag response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    color: str
    is_active: bool
    created_at: datetime


class TagAssign(BaseModel):
    """Schema for assigning tags to a task"""

    tag_ids: list[UUID] = Field(..., min_length=1)
