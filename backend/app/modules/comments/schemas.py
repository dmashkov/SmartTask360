"""
SmartTask360 — Comment schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CommentCreate(BaseModel):
    """Schema for creating a comment"""

    task_id: UUID
    content: str = Field(..., min_length=1)
    reply_to_id: UUID | None = None


class CommentUpdate(BaseModel):
    """Schema for updating a comment (only content can be edited)"""

    content: str = Field(..., min_length=1)


class CommentResponse(BaseModel):
    """Schema for comment response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    author_id: UUID | None
    author_type: str
    content: str
    mentioned_user_ids: list[UUID] | None = None
    reply_to_id: UUID | None
    created_at: datetime
    updated_at: datetime


# Reaction schemas
class ReactionCreate(BaseModel):
    """Schema for adding a reaction"""

    emoji: str = Field(..., min_length=1, max_length=10)


class ReactionResponse(BaseModel):
    """Schema for reaction response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    comment_id: UUID
    user_id: UUID
    emoji: str
    created_at: datetime


class ReactionSummary(BaseModel):
    """Schema for reaction summary (emoji with count and user list)"""

    emoji: str
    count: int
    user_ids: list[UUID]
    has_current_user: bool = False
