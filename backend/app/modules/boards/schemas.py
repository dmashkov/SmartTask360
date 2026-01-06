"""
SmartTask360 — Board schemas (Pydantic validation)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.types import BoardMemberRole


# ============================================================================
# Board Schemas
# ============================================================================


class BoardCreate(BaseModel):
    """Schema for creating a new board"""

    name: str = Field(..., min_length=1, max_length=200)
    description: str | None = None
    project_id: UUID | None = None
    department_id: UUID | None = None
    workflow_template_id: UUID | None = None
    is_private: bool = False


class BoardUpdate(BaseModel):
    """Schema for updating a board"""

    name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    project_id: UUID | None = None
    department_id: UUID | None = None
    workflow_template_id: UUID | None = None
    is_private: bool | None = None
    is_archived: bool | None = None


class BoardResponse(BaseModel):
    """Schema for board response"""

    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    project_id: UUID | None
    department_id: UUID | None
    workflow_template_id: UUID | None
    is_private: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BoardListResponse(BaseModel):
    """Schema for board list response with additional info"""

    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    is_private: bool
    is_archived: bool
    column_count: int = 0
    task_count: int = 0
    member_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# BoardColumn Schemas
# ============================================================================


class BoardColumnCreate(BaseModel):
    """Schema for creating a board column"""

    name: str = Field(..., min_length=1, max_length=100)
    mapped_status: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=20)
    wip_limit: int = Field(0, ge=0, description="0 means no limit")
    order_index: int | None = None  # If None, will be set to max + 1


class BoardColumnUpdate(BaseModel):
    """Schema for updating a board column"""

    name: str | None = Field(None, min_length=1, max_length=100)
    mapped_status: str | None = None
    color: str | None = None
    wip_limit: int | None = Field(None, ge=0)
    is_collapsed: bool | None = None


class BoardColumnReorder(BaseModel):
    """Schema for reordering columns"""

    column_ids: list[UUID] = Field(..., min_length=1)


class BoardColumnResponse(BaseModel):
    """Schema for column response"""

    id: UUID
    board_id: UUID
    name: str
    mapped_status: str | None
    order_index: int
    color: str | None
    wip_limit: int
    is_collapsed: bool
    task_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# BoardTask Schemas
# ============================================================================


class BoardTaskAdd(BaseModel):
    """Schema for adding a task to a board"""

    task_id: UUID
    column_id: UUID
    order_index: int | None = None  # If None, will be set to end of column


class BoardTaskMove(BaseModel):
    """Schema for moving a task on the board"""

    column_id: UUID
    order_index: int | None = None  # If None, will be set to end of column
    force: bool = False  # Force move even if WIP limit is reached


class BoardTaskResponse(BaseModel):
    """Schema for board task response"""

    id: UUID
    board_id: UUID
    task_id: UUID
    column_id: UUID
    order_index: int
    added_at: datetime
    moved_at: datetime

    model_config = {"from_attributes": True}


class BoardTaskWithDetails(BaseModel):
    """Schema for board task with task details"""

    id: UUID
    board_id: UUID
    task_id: UUID
    column_id: UUID
    order_index: int
    added_at: datetime
    moved_at: datetime

    # Task details
    task_title: str
    task_status: str
    task_priority: str
    task_assignee_id: UUID | None
    task_due_date: datetime | None

    # Comment indicators
    total_comments_count: int = 0
    unread_comments_count: int = 0
    unread_mentions_count: int = 0

    model_config = {"from_attributes": True}


class MoveResult(BaseModel):
    """Result of a task move operation"""

    success: bool
    message: str | None = None
    task: BoardTaskResponse | None = None
    status_changed: bool = False
    new_status: str | None = None
    wip_warning: bool = False  # True if WIP limit is close to being reached


# ============================================================================
# BoardMember Schemas
# ============================================================================


class BoardMemberAdd(BaseModel):
    """Schema for adding a member to a board"""

    user_id: UUID
    role: BoardMemberRole = BoardMemberRole.MEMBER


class BoardMemberUpdate(BaseModel):
    """Schema for updating a member's role"""

    role: BoardMemberRole


class BoardMemberResponse(BaseModel):
    """Schema for board member response"""

    id: UUID
    board_id: UUID
    user_id: UUID
    role: str
    added_at: datetime

    model_config = {"from_attributes": True}


class BoardMemberWithDetails(BaseModel):
    """Schema for board member with user details"""

    id: UUID
    board_id: UUID
    user_id: UUID
    role: str
    added_at: datetime

    # User details
    user_name: str
    user_email: str

    model_config = {"from_attributes": True}


# ============================================================================
# Board Full Response (with columns and tasks)
# ============================================================================


class BoardFullResponse(BaseModel):
    """Full board response with columns, tasks, and members"""

    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    project_id: UUID | None
    department_id: UUID | None
    workflow_template_id: UUID | None
    is_private: bool
    is_archived: bool
    created_at: datetime
    updated_at: datetime

    columns: list[BoardColumnResponse] = []
    tasks: list[BoardTaskWithDetails] = []
    members: list[BoardMemberWithDetails] = []

    model_config = {"from_attributes": True}


# ============================================================================
# Default Columns Template
# ============================================================================


class ColumnTemplate(BaseModel):
    """Template for creating default columns"""

    name: str
    mapped_status: str | None = None
    color: str | None = None
    wip_limit: int = 0


# Default column templates for different workflows
DEFAULT_COLUMNS = {
    "basic": [
        ColumnTemplate(name="Новые", mapped_status="new", color="#9ca3af"),
        ColumnTemplate(name="В работе", mapped_status="in_progress", color="#3b82f6"),
        ColumnTemplate(name="На проверке", mapped_status="in_review", color="#f59e0b"),
        ColumnTemplate(name="Готово", mapped_status="done", color="#22c55e"),
    ],
    "agile": [
        ColumnTemplate(name="Backlog", mapped_status=None, color="#6b7280"),
        ColumnTemplate(name="To Do", mapped_status="new", color="#9ca3af"),
        ColumnTemplate(name="In Progress", mapped_status="in_progress", color="#3b82f6", wip_limit=5),
        ColumnTemplate(name="Review", mapped_status="in_review", color="#f59e0b", wip_limit=3),
        ColumnTemplate(name="Done", mapped_status="done", color="#22c55e"),
    ],
    "approval": [
        ColumnTemplate(name="Черновик", mapped_status="draft", color="#6b7280"),
        ColumnTemplate(name="На согласовании", mapped_status="in_review", color="#f59e0b"),
        ColumnTemplate(name="Утверждено", mapped_status="done", color="#22c55e"),
        ColumnTemplate(name="Отклонено", mapped_status="cancelled", color="#ef4444"),
    ],
}
