"""
SmartTask360 — Comment model
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text, Table, Column
from sqlalchemy.dialects.postgresql import ARRAY, UUID as PgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


# Association table for tracking read comments per user
comment_read_status = Table(
    "comment_read_status",
    Base.metadata,
    Column("user_id", PgUUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("comment_id", PgUUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True),
    Column("read_at", DateTime, nullable=False, default=datetime.utcnow),
)


class Comment(Base):
    """
    Comment model - represents comments/discussions on tasks.

    Supports threaded comments via reply_to_id.
    author_type allows for AI/system-generated comments in future.
    mentioned_user_ids stores UUIDs of users mentioned with @.
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

    # Mentions
    mentioned_user_ids: Mapped[list[UUID] | None] = mapped_column(
        ARRAY(PgUUID(as_uuid=True)), nullable=True, default=list
    )

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
