"""
SmartTask360 — Project schemas
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.types import ProjectMemberRole, ProjectStatus


# ============================================================
# Project Schemas
# ============================================================


class ProjectCreate(BaseModel):
    """Schema for creating a project"""

    name: str = Field(..., min_length=1, max_length=200)
    code: str = Field(..., min_length=2, max_length=20, pattern=r"^[A-Z0-9_-]+$")
    description: str | None = None
    status: ProjectStatus = ProjectStatus.PLANNING
    department_id: UUID | None = None
    start_date: datetime | None = None
    due_date: datetime | None = None
    settings: dict | None = None

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, v: str) -> str:
        return v.upper()


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""

    name: str | None = Field(None, min_length=1, max_length=200)
    code: str | None = Field(None, min_length=2, max_length=20, pattern=r"^[A-Z0-9_-]+$")
    description: str | None = None
    status: ProjectStatus | None = None
    department_id: UUID | None = None
    start_date: datetime | None = None
    due_date: datetime | None = None
    settings: dict | None = None

    @field_validator("code")
    @classmethod
    def code_uppercase(cls, v: str | None) -> str | None:
        return v.upper() if v else v


class ProjectResponse(BaseModel):
    """Schema for project response"""

    id: UUID
    name: str
    code: str
    description: str | None
    status: str
    owner_id: UUID
    department_id: UUID | None
    start_date: datetime | None
    due_date: datetime | None
    completed_at: datetime | None
    settings: dict | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectStats(BaseModel):
    """Project statistics"""

    total_tasks: int = 0
    tasks_by_status: dict[str, int] = Field(default_factory=dict)
    completed_tasks: int = 0
    completion_percentage: float = 0.0
    overdue_tasks: int = 0
    total_boards: int = 0
    total_members: int = 0


class ProjectWithStats(ProjectResponse):
    """Project response with statistics"""

    stats: ProjectStats


class ProjectListResponse(BaseModel):
    """Schema for project list response"""

    id: UUID
    name: str
    code: str
    status: str
    owner_id: UUID
    due_date: datetime | None
    created_at: datetime
    task_count: int = 0
    member_count: int = 0

    model_config = {"from_attributes": True}


# ============================================================
# Project Member Schemas
# ============================================================


class ProjectMemberCreate(BaseModel):
    """Schema for adding a project member"""

    user_id: UUID
    role: ProjectMemberRole = ProjectMemberRole.MEMBER


class ProjectMemberUpdate(BaseModel):
    """Schema for updating a project member"""

    role: ProjectMemberRole


class ProjectMemberResponse(BaseModel):
    """Schema for project member response"""

    project_id: UUID
    user_id: UUID
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectMemberWithUser(ProjectMemberResponse):
    """Project member with user details"""

    user_email: str
    user_name: str | None = None


# ============================================================
# Filter Schemas
# ============================================================


class ProjectFilters(BaseModel):
    """Filters for project list"""

    status: ProjectStatus | None = None
    owner_id: UUID | None = None
    department_id: UUID | None = None
    search: str | None = None
    include_archived: bool = False
