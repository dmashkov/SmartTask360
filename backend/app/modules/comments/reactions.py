"""
SmartTask360 — Comment Reactions model
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class CommentReaction(Base):
    """
    Comment Reaction model - emoji reactions to comments.

    Each user can add one reaction of each emoji type to a comment.
    """

    __tablename__ = "comment_reactions"

    # Primary key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Relations
    comment_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)

    # Emoji (stored as unicode emoji character)
    emoji: Mapped[str] = mapped_column(String(10), nullable=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )

    # Unique constraint: one user can only add each emoji once per comment
    __table_args__ = (
        UniqueConstraint("comment_id", "user_id", "emoji", name="unique_comment_user_emoji"),
    )

    def __repr__(self) -> str:
        return f"<CommentReaction {self.emoji} on comment {self.comment_id}>"
