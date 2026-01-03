"""
SmartTask360 — Task History models
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaskHistory(Base):
    """
    Task History model — tracks all changes to tasks for audit trail

    Stores a record each time a task is created or updated, capturing:
    - What changed (field_name)
    - Old value (old_value)
    - New value (new_value)
    - Who made the change (changed_by_id)
    - When it happened (created_at)
    - Type of change (action: created, updated, status_changed, assigned, etc.)
    """

    __tablename__ = "task_history"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    changed_by_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Type of action
    action: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # created, updated, status_changed, assigned, etc.

    # What changed
    field_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # title, status, assignee_id, etc.

    # Values (stored as JSONB for flexibility)
    old_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    new_value: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Optional comment/description
    comment: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Additional metadata (can store structured data)
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )
