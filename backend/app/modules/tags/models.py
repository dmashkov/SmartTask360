"""
SmartTask360 — Tag model
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, String, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


# Many-to-many association table for tasks and tags
task_tags = Table(
    "task_tags",
    Base.metadata,
    Column("task_id", ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """
    Tag model - represents labels/categories for tasks.

    Tags are shared across all tasks and can be assigned to multiple tasks.
    """

    __tablename__ = "tags"

    # Primary key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Tag properties
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    color: Mapped[str] = mapped_column(
        String(7), nullable=False, default="#6B7280"
    )  # Hex color code

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=datetime.utcnow)

    def __repr__(self) -> str:
        return f"<Tag {self.name}>"
