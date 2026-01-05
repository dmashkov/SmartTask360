"""
SmartTask360 — User Views Schemas
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


class UserViewCreate(BaseModel):
    """Schema for creating a new user view."""

    name: str = Field(..., min_length=1, max_length=100, description="View name")
    filters: dict[str, Any] = Field(default_factory=dict, description="Filter configuration")
    view_type: str = Field(default="task", description="View type (task, board, project)")
    is_default: bool = Field(default=False, description="Set as default view")
    icon: str | None = Field(default=None, max_length=50, description="Icon identifier")
    color: str | None = Field(default=None, max_length=20, description="Color hex code")


class UserViewUpdate(BaseModel):
    """Schema for updating a user view."""

    name: str | None = Field(default=None, min_length=1, max_length=100)
    filters: dict[str, Any] | None = None
    is_default: bool | None = None
    sort_order: int | None = None
    icon: str | None = None
    color: str | None = None


class UserViewResponse(BaseModel):
    """Schema for user view response."""

    id: UUID
    user_id: UUID
    name: str
    filters: dict[str, Any]
    view_type: str
    is_default: bool
    sort_order: int
    icon: str | None
    color: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserViewReorder(BaseModel):
    """Schema for reordering views."""

    view_ids: list[UUID] = Field(..., description="List of view IDs in desired order")
