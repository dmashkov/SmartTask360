"""
SmartTask360 — Workflow models (status templates and transitions)
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class WorkflowTemplate(Base):
    """
    Workflow template (collection of statuses and allowed transitions)

    Examples:
    - basic: Новая → В работе → На проверке → Готово
    - agile: Backlog → To Do → In Progress → Review → Done
    - approval: Черновик → На согласовании → Утверждено → Готово
    """

    __tablename__ = "workflow_templates"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    display_name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # JSON array of status definitions
    # Example: [{"key": "new", "label": "Новая", "color": "#gray"}, ...]
    statuses: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # Default initial status when task is created
    initial_status: Mapped[str] = mapped_column(String(50), nullable=False)

    # Final statuses (task is considered completed)
    final_statuses: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )


class StatusTransition(Base):
    """
    Allowed status transition within a workflow template

    Defines rules for moving from one status to another:
    - Which roles can perform the transition
    - Whether comment is required
    - Custom validation rules
    """

    __tablename__ = "status_transitions"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    template_id: Mapped[UUID] = mapped_column(
        ForeignKey("workflow_templates.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    from_status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    to_status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # Roles allowed to perform this transition (empty = all roles)
    # Example: ["admin", "project_manager"]
    allowed_roles: Mapped[list] = mapped_column(JSONB, nullable=False, default=list)

    # Whether comment is required for this transition
    requires_comment: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Whether assignee acceptance is required
    requires_acceptance: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Additional validation rules (for future extensibility)
    # Example: {"min_completion_percent": 100, "all_subtasks_done": true}
    validation_rules: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Display order for UI
    display_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP, nullable=False, default=datetime.utcnow
    )
