"""
SmartTask360 — Task model
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DECIMAL, Boolean, Column, ForeignKey, String, Table, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.modules.departments.models import LTREE


# Many-to-many: Task Watchers (users who watch task updates)
task_watchers = Table(
    "task_watchers",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


# Many-to-many: Task Participants (users who participate in task execution)
task_participants = Table(
    "task_participants",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Task(Base):
    """
    Task model - represents work items with hierarchy, status, and assignments.

    Uses PostgreSQL ltree for efficient hierarchical queries.
    Path format: "root_id.parent_id.task_id"
    """

    __tablename__ = "tasks"

    # Primary key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Content
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Status & Priority
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="new", index=True)
    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="medium"
    )  # low/medium/high/critical

    # Ownership & Assignment
    # author_id - who physically created the task (immutable)
    author_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    # creator_id - on whose behalf the task was created (can be changed)
    creator_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    # assignee_id - who will execute the task (can be changed)
    assignee_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)

    # Hierarchy (ltree)
    parent_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)
    path: Mapped[str] = mapped_column(LTREE, nullable=False, index=True)
    depth: Mapped[int] = mapped_column(nullable=False, default=0)

    # Relations (optional for MVP)
    department_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)
    project_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)

    # Workflow
    workflow_template_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("workflow_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Source tracking
    source_document_id: Mapped[UUID | None] = mapped_column(nullable=True)
    source_quote: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Dates
    due_date: Mapped[datetime | None] = mapped_column(nullable=True, index=True)
    started_at: Mapped[datetime | None] = mapped_column(nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Flags
    is_milestone: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

    # Time tracking
    estimated_hours: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True)
    actual_hours: Mapped[Decimal | None] = mapped_column(DECIMAL(10, 2), nullable=True)

    # Task acceptance flow
    accepted_at: Mapped[datetime | None] = mapped_column(nullable=True)
    acceptance_deadline: Mapped[datetime | None] = mapped_column(nullable=True)
    rejection_reason: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # unclear/no_resources/unrealistic_deadline/conflict/wrong_assignee/other
    rejection_comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Completion
    completion_result: Mapped[str | None] = mapped_column(
        Text, nullable=True
    )  # Result/comment when task is completed or sent to review

    # SMART Validation
    smart_score: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # Full SMART validation result
    smart_validated_at: Mapped[datetime | None] = mapped_column(nullable=True)
    smart_is_valid: Mapped[bool | None] = mapped_column(
        Boolean, nullable=True
    )  # Quick check without reading JSON

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Task {self.title[:30]} ({self.status})>"
