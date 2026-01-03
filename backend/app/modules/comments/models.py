"""
SmartTask360 — Comment model
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Comment(Base):
    """
    Comment model - represents comments/discussions on tasks.

    Supports threaded comments via reply_to_id.
    author_type allows for AI/system-generated comments in future.
    """

    __tablename__ = "comments"

    # Primary key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Relations
    task_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    author_id: Mapped[UUID | None] = mapped_column(
        nullable=True, index=True
    )  # Null for AI/system comments
    author_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="user"
    )  # user/ai/system

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Threading
    reply_to_id: Mapped[UUID | None] = mapped_column(
        nullable=True
    )  # Parent comment for threads

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Comment on task {self.task_id}>"
