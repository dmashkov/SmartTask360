"""
SmartTask360 — Document schemas (Pydantic)
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentUpload(BaseModel):
    """Schema for uploading a document (multipart form data)"""

    task_id: UUID
    description: str | None = None


class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""

    description: str | None = None


class DocumentResponse(BaseModel):
    """Schema for document response"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    uploader_id: UUID | None
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    storage_path: str
    description: str | None
    created_at: datetime
    updated_at: datetime


class DocumentListItem(BaseModel):
    """Schema for document in list (without storage_path)"""

    model_config = ConfigDict(from_attributes=True)

    id: UUID
    task_id: UUID
    uploader_id: UUID | None
    filename: str
    original_filename: str
    mime_type: str
    file_size: int
    description: str | None
    created_at: datetime


class DocumentStats(BaseModel):
    """Schema for document statistics"""

    total_count: int
    total_size: int  # Total size in bytes
    total_size_mb: float  # Total size in MB
