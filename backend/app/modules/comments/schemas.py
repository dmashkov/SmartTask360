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
    reply_to_id: UUID | None
    created_at: datetime
    updated_at: datetime
