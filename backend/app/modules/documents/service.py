"""
SmartTask360 — Document service (business logic)
"""

import os
from datetime import datetime
from typing import BinaryIO
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import storage_service
from app.modules.documents.models import Document
from app.modules.documents.schemas import DocumentStats, DocumentUpdate


class DocumentService:
    """Service for document operations"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.storage = storage_service

    async def get_by_id(self, document_id: UUID) -> Document | None:
        """Get document by ID"""
        result = await self.db.execute(select(Document).where(Document.id == document_id))
        return result.scalar_one_or_none()

    async def get_task_documents(
        self, task_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Document]:
        """Get all documents for a task"""
        result = await self.db.execute(
            select(Document)
            .where(Document.task_id == task_id)
            .order_by(Document.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def upload(
        self,
        task_id: UUID,
        uploader_id: UUID,
        file_data: BinaryIO,
        filename: str,
        content_type: str,
        file_size: int,
        description: str | None = None,
        document_type: str = "attachment",
    ) -> Document:
        """
        Upload document to MinIO and save metadata to database

        Args:
            task_id: ID of the task
            uploader_id: ID of the user uploading
            file_data: File content (file-like object)
            filename: Original filename
            content_type: MIME type
            file_size: File size in bytes
            description: Optional description
            document_type: Type of document (requirement | attachment | result)
        """
        # Generate unique filename to avoid collisions
        file_ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid4()}{file_ext}"

        # Create storage path: tasks/{task_id}/{unique_filename}
        storage_path = f"tasks/{task_id}/{unique_filename}"

        # Upload to MinIO
        self.storage.upload_file(
            file_data=file_data,
            object_name=storage_path,
            content_type=content_type,
            file_size=file_size,
        )

        # Save metadata to database
        document = Document(
            task_id=task_id,
            uploader_id=uploader_id,
            filename=unique_filename,
            original_filename=filename,
            mime_type=content_type,
            file_size=file_size,
            storage_path=storage_path,
            description=description,
            document_type=document_type,
        )

        self.db.add(document)
        await self.db.commit()
        await self.db.refresh(document)
        return document

    async def download(self, document_id: UUID) -> tuple[bytes, str, str] | None:
        """
        Download document from MinIO

        Returns:
            Tuple of (file_content, original_filename, mime_type) or None if not found
        """
        document = await self.get_by_id(document_id)
        if not document:
            return None

        try:
            file_content = self.storage.download_file(document.storage_path)
            return (file_content, document.original_filename, document.mime_type)
        except Exception as e:
            print(f"Error downloading file: {e}")
            return None

    async def get_download_url(self, document_id: UUID, expires_seconds: int = 3600) -> str | None:
        """
        Get presigned download URL for document

        Args:
            document_id: ID of the document
            expires_seconds: URL expiration time in seconds (default 1 hour)

        Returns:
            Presigned URL or None if document not found
        """
        document = await self.get_by_id(document_id)
        if not document:
            return None

        try:
            url = self.storage.get_presigned_url(document.storage_path, expires_seconds)
            return url
        except Exception as e:
            print(f"Error generating download URL: {e}")
            return None

    async def update(
        self, document_id: UUID, document_data: DocumentUpdate, user_id: UUID
    ) -> Document | None:
        """Update document metadata (only uploader can update)"""
        document = await self.get_by_id(document_id)
        if not document:
            return None

        # Only uploader can update
        if document.uploader_id != user_id:
            raise ValueError("Only document uploader can update metadata")

        # Update description
        if document_data.description is not None:
            document.description = document_data.description

        await self.db.commit()
        await self.db.refresh(document)
        return document

    async def delete(self, document_id: UUID, user_id: UUID) -> bool:
        """
        Delete document (only uploader can delete)
        Deletes both from MinIO and database
        """
        document = await self.get_by_id(document_id)
        if not document:
            return False

        # Only uploader can delete
        if document.uploader_id != user_id:
            raise ValueError("Only document uploader can delete")

        # Delete from MinIO
        self.storage.delete_file(document.storage_path)

        # Delete from database
        await self.db.delete(document)
        await self.db.commit()
        return True

    async def get_task_stats(self, task_id: UUID) -> DocumentStats:
        """Get document statistics for a task"""
        result = await self.db.execute(
            select(
                func.count(Document.id).label("count"),
                func.sum(Document.file_size).label("total_size"),
            ).where(Document.task_id == task_id)
        )

        row = result.one()
        total_count = row.count or 0
        total_size = row.total_size or 0
        total_size_mb = round(total_size / (1024 * 1024), 2) if total_size > 0 else 0.0

        return DocumentStats(
            total_count=total_count,
            total_size=total_size,
            total_size_mb=total_size_mb,
        )
