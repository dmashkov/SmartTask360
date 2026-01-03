"""
SmartTask360 — AI Models
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AIConversation(Base):
    """
    AI Conversation - tracks AI interactions for tasks.

    Types:
    - smart_validation: SMART criteria validation
    - task_dialog: Interactive task clarification
    - risk_analysis: AI-generated risk assessment
    - decomposition: Task breakdown suggestions
    - progress_review: Progress analysis
    """

    __tablename__ = "ai_conversations"

    # Primary key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Conversation metadata
    conversation_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # smart_validation | task_dialog | risk_analysis | decomposition | progress_review

    # Relations
    task_id: Mapped[UUID] = mapped_column(nullable=False, index=True)
    user_id: Mapped[UUID] = mapped_column(nullable=False, index=True)

    # AI Configuration
    model: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # e.g., "claude-sonnet-4-20250514"
    temperature: Mapped[float] = mapped_column(nullable=False, default=0.5)

    # Status
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="active", index=True
    )  # active | completed | failed

    # Context and results
    context: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # Initial context (task details, etc.)
    result: Mapped[dict | None] = mapped_column(
        JSONB, nullable=True
    )  # Final result (SMART scores, suggestions, etc.)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<AIConversation {self.conversation_type} for task {self.task_id}>"


class AIMessage(Base):
    """
    AI Message - individual messages in a conversation.

    Tracks both user prompts and AI responses for audit and replay.
    """

    __tablename__ = "ai_messages"

    # Primary key
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # Relations
    conversation_id: Mapped[UUID] = mapped_column(
        ForeignKey("ai_conversations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Message content
    role: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # user | assistant | system
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # Message metadata
    sequence: Mapped[int] = mapped_column(
        nullable=False
    )  # Order in conversation (0, 1, 2...)
    token_count: Mapped[int | None] = mapped_column(nullable=True)  # For cost tracking
    model_used: Mapped[str | None] = mapped_column(
        String(100), nullable=True
    )  # Model that generated this response

    # Timing
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )

    def __repr__(self) -> str:
        preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"<AIMessage {self.role}: {preview}>"
