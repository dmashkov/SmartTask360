"""
SmartTask360 — Documents API endpoints
"""

from uuid import UUID

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from fastapi.responses import Response, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.documents.schemas import (
    DocumentListItem,
    DocumentResponse,
    DocumentStats,
    DocumentUpdate,
)
from app.modules.documents.service import DocumentService
from app.modules.users.models import User

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/tasks/{task_id}/documents", response_model=list[DocumentListItem])
async def get_task_documents(
    task_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all documents for a task"""
    service = DocumentService(db)
    documents = await service.get_task_documents(task_id, skip=skip, limit=limit)
    return documents


@router.get("/tasks/{task_id}/stats", response_model=DocumentStats)
async def get_task_document_stats(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document statistics for a task"""
    service = DocumentService(db)
    stats = await service.get_task_stats(task_id)
    return stats


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get document metadata by ID"""
    service = DocumentService(db)
    document = await service.get_by_id(document_id)

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return document


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    task_id: UUID = Form(...),
    file: UploadFile = File(...),
    description: str | None = Form(None),
    document_type: str = Form("attachment"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Upload document to a task

    Accepts multipart/form-data with:
    - task_id: UUID of the task
    - file: The file to upload
    - description: Optional description
    - document_type: Type of document (requirement | attachment | result), default: attachment
    """
    service = DocumentService(db)

    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is required",
        )

    # Get file size
    file_content = await file.read()
    file_size = len(file_content)

    # Check file size (max 100MB)
    MAX_FILE_SIZE = 100 * 1024 * 1024  # 100 MB
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    # Reset file pointer
    import io

    file_data = io.BytesIO(file_content)

    try:
        document = await service.upload(
            task_id=task_id,
            uploader_id=current_user.id,
            file_data=file_data,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            file_size=file_size,
            description=description,
            document_type=document_type,
        )
        return document
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}",
        )


@router.get("/{document_id}/download")
async def download_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Download document file"""
    service = DocumentService(db)
    result = await service.download(document_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    file_content, original_filename, mime_type = result

    return Response(
        content=file_content,
        media_type=mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{original_filename}"',
        },
    )


@router.get("/{document_id}/download-url")
async def get_document_download_url(
    document_id: UUID,
    expires_seconds: int = 3600,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get presigned download URL for document"""
    service = DocumentService(db)
    url = await service.get_download_url(document_id, expires_seconds)

    if not url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    return {"download_url": url, "expires_in": expires_seconds}


@router.patch("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: UUID,
    document_data: DocumentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update document metadata (only uploader can update)"""
    service = DocumentService(db)

    try:
        document = await service.update(document_id, document_data, user_id=current_user.id)

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        return document
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete document (only uploader can delete)"""
    service = DocumentService(db)

    try:
        success = await service.delete(document_id, user_id=current_user.id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )

        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )
