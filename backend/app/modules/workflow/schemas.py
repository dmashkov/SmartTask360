"""
SmartTask360 — Workflow schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ===== Status Definition =====


class StatusDefinition(BaseModel):
    """Single status definition within a workflow"""

    key: str = Field(..., description="Unique status key (e.g., 'in_progress')")
    label: str = Field(..., description="Display label (e.g., 'В работе')")
    color: str = Field(default="#6B7280", description="Hex color code")
    description: str | None = Field(None, description="Optional description")


# ===== Workflow Template Schemas =====


class WorkflowTemplateCreate(BaseModel):
    """Schema for creating a workflow template"""

    name: str = Field(..., min_length=1, max_length=100, description="Unique template name")
    display_name: str = Field(..., min_length=1, max_length=200, description="Display name")
    description: str | None = None
    statuses: list[StatusDefinition] = Field(..., min_items=2, description="List of statuses")
    initial_status: str = Field(..., description="Default initial status key")
    final_statuses: list[str] = Field(default_factory=list, description="Final status keys")


class WorkflowTemplateUpdate(BaseModel):
    """Schema for updating a workflow template"""

    display_name: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = None
    statuses: list[StatusDefinition] | None = Field(None, min_items=2)
    initial_status: str | None = None
    final_statuses: list[str] | None = None
    is_active: bool | None = None


class WorkflowTemplateResponse(BaseModel):
    """Schema for workflow template response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    display_name: str
    description: str | None
    is_system: bool
    is_active: bool
    statuses: dict  # JSON with status definitions
    initial_status: str
    final_statuses: list  # JSON array
    created_at: datetime
    updated_at: datetime


# ===== Status Transition Schemas =====


class StatusTransitionCreate(BaseModel):
    """Schema for creating a status transition"""

    template_id: UUID
    from_status: str = Field(..., min_length=1, max_length=50)
    to_status: str = Field(..., min_length=1, max_length=50)
    allowed_roles: list[str] = Field(default_factory=list, description="Roles allowed (empty = all)")
    requires_comment: bool = Field(default=False, description="Is comment required?")
    requires_acceptance: bool = Field(default=False, description="Requires assignee acceptance?")
    validation_rules: dict | None = Field(None, description="Additional validation rules")
    display_order: int = Field(default=0, ge=0)


class StatusTransitionUpdate(BaseModel):
    """Schema for updating a status transition"""

    allowed_roles: list[str] | None = None
    requires_comment: bool | None = None
    requires_acceptance: bool | None = None
    validation_rules: dict | None = None
    display_order: int | None = Field(None, ge=0)


class StatusTransitionResponse(BaseModel):
    """Schema for status transition response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    template_id: UUID
    from_status: str
    to_status: str
    allowed_roles: list  # JSON array
    requires_comment: bool
    requires_acceptance: bool
    validation_rules: dict | None
    display_order: int
    created_at: datetime


# ===== Validation Schemas =====


class TransitionValidationRequest(BaseModel):
    """Schema for validating a status transition"""

    template_id: UUID
    from_status: str
    to_status: str
    user_role: str = Field(..., description="User's role")
    has_comment: bool = Field(default=False, description="Does request include a comment?")


class TransitionValidationResponse(BaseModel):
    """Schema for transition validation result"""

    is_valid: bool
    message: str | None = None
    required_fields: list[str] = Field(default_factory=list)
