"""
SmartTask360 — Task History API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.task_history.schemas import (
    TaskHistoryCreate,
    TaskHistoryFilter,
    TaskHistoryResponse,
    TaskHistorySummary,
)
from app.modules.task_history.service import TaskHistoryService
from app.modules.users.models import User

router = APIRouter(prefix="/task-history", tags=["task-history"])


@router.get("/tasks/{task_id}/history", response_model=list[TaskHistoryResponse])
async def get_task_history(
    task_id: UUID,
    action: str | None = Query(None, description="Filter by action type"),
    field_name: str | None = Query(None, description="Filter by field name"),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get history entries for a task"""
    service = TaskHistoryService(db)

    filters = TaskHistoryFilter(action=action, field_name=field_name)
    history = await service.get_task_history(task_id, filters=filters, skip=skip, limit=limit)
    return history


@router.get("/tasks/{task_id}/summary", response_model=TaskHistorySummary)
async def get_task_history_summary(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get summary statistics for task history"""
    service = TaskHistoryService(db)
    summary = await service.get_task_summary(task_id)
    return summary


@router.get("/users/me/activity", response_model=list[TaskHistoryResponse])
async def get_my_activity(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all history entries made by current user"""
    service = TaskHistoryService(db)
    activity = await service.get_user_activity(current_user.id, skip=skip, limit=limit)
    return activity


@router.get("/users/{user_id}/activity", response_model=list[TaskHistoryResponse])
async def get_user_activity(
    user_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all history entries made by a specific user"""
    service = TaskHistoryService(db)
    activity = await service.get_user_activity(user_id, skip=skip, limit=limit)
    return activity


@router.get("/recent", response_model=list[TaskHistoryResponse])
async def get_recent_changes(
    limit: int = Query(50, le=200, description="Maximum number of entries to return"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get recent changes across all tasks"""
    service = TaskHistoryService(db)
    changes = await service.get_recent_changes(limit=limit)
    return changes


@router.post("/", response_model=TaskHistoryResponse, status_code=status.HTTP_201_CREATED)
async def create_history_entry(
    entry_data: TaskHistoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Create a custom history entry (for manual logging)

    Note: Most history entries are created automatically by the system
    when tasks are modified. This endpoint is for custom/manual entries.
    """
    service = TaskHistoryService(db)
    entry = await service.create_entry(entry_data)
    return entry


@router.delete("/tasks/{task_id}/history", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task_history(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Delete all history entries for a task

    Warning: This is a destructive operation and should be used carefully.
    Typically only used when a task is being permanently deleted.
    """
    # Check if user has permission (e.g., admin only)
    # For now, any authenticated user can delete history
    service = TaskHistoryService(db)
    deleted_count = await service.delete_task_history(task_id)

    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No history entries found for this task",
        )

    return None
