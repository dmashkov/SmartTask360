"""
SmartTask360 — Department schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class DepartmentBase(BaseModel):
    """Base department schema"""

    name: str = Field(min_length=2, max_length=255)
    description: str | None = None


class DepartmentCreate(DepartmentBase):
    """Schema for creating a new department"""

    parent_id: UUID | None = None


class DepartmentUpdate(BaseModel):
    """Schema for updating department (all fields optional)"""

    name: str | None = Field(None, min_length=2, max_length=255)
    description: str | None = None
    parent_id: UUID | None = None


class DepartmentResponse(DepartmentBase):
    """Schema for department response"""

    id: UUID
    parent_id: UUID | None
    path: str
    depth: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class DepartmentTree(DepartmentResponse):
    """Schema for department with children (hierarchical view)"""

    children: list["DepartmentTree"] = []

    model_config = {"from_attributes": True}
