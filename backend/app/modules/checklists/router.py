"""
SmartTask360 — Checklists API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.checklists.schemas import (
    ChecklistCreate,
    ChecklistItemCreate,
    ChecklistItemMove,
    ChecklistItemResponse,
    ChecklistItemToggle,
    ChecklistItemUpdate,
    ChecklistResponse,
    ChecklistStatsResponse,
    ChecklistUpdate,
    ChecklistWithItemsResponse,
)
from app.modules.checklists.service import ChecklistService
from app.modules.users.models import User

router = APIRouter(prefix="/checklists", tags=["checklists"])


# ========== Checklist endpoints ==========


@router.get("/tasks/{task_id}/checklists", response_model=list[ChecklistWithItemsResponse])
async def get_task_checklists(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all checklists for a task with items"""
    service = ChecklistService(db)
    checklists = await service.get_task_checklists_with_items(task_id)
    return checklists


@router.get("/{checklist_id}", response_model=ChecklistResponse)
async def get_checklist(
    checklist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get checklist by ID (without items)"""
    service = ChecklistService(db)
    checklist = await service.get_checklist_by_id(checklist_id)

    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    return checklist


@router.get("/{checklist_id}/with-items", response_model=ChecklistWithItemsResponse)
async def get_checklist_with_items(
    checklist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get checklist with all items"""
    service = ChecklistService(db)
    checklist = await service.get_checklist_with_items(checklist_id)

    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    return checklist


@router.get("/{checklist_id}/stats", response_model=ChecklistStatsResponse)
async def get_checklist_stats(
    checklist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get checklist completion statistics"""
    service = ChecklistService(db)

    # Verify checklist exists
    checklist = await service.get_checklist_by_id(checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    stats = await service.get_checklist_stats(checklist_id)
    return stats


@router.post("/", response_model=ChecklistResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist(
    checklist_data: ChecklistCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new checklist"""
    service = ChecklistService(db)
    checklist = await service.create_checklist(checklist_data)
    return checklist


@router.patch("/{checklist_id}", response_model=ChecklistResponse)
async def update_checklist(
    checklist_id: UUID,
    checklist_data: ChecklistUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update checklist"""
    service = ChecklistService(db)
    checklist = await service.update_checklist(checklist_id, checklist_data)

    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    return checklist


@router.delete("/{checklist_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist(
    checklist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete checklist (cascade deletes all items)"""
    service = ChecklistService(db)
    success = await service.delete_checklist(checklist_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    return None


# ========== Checklist Item endpoints ==========


@router.get("/{checklist_id}/items", response_model=list[ChecklistItemResponse])
async def get_checklist_items(
    checklist_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all items for a checklist (hierarchical order)"""
    service = ChecklistService(db)

    # Verify checklist exists
    checklist = await service.get_checklist_by_id(checklist_id)
    if not checklist:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist not found",
        )

    items = await service.get_checklist_items(checklist_id)
    return items


@router.get("/items/{item_id}", response_model=ChecklistItemResponse)
async def get_checklist_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get checklist item by ID"""
    service = ChecklistService(db)
    item = await service.get_item_by_id(item_id)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist item not found",
        )

    return item


@router.get("/items/{item_id}/children", response_model=list[ChecklistItemResponse])
async def get_item_children(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get direct children of a checklist item"""
    service = ChecklistService(db)

    # Verify item exists
    item = await service.get_item_by_id(item_id)
    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist item not found",
        )

    children = await service.get_item_children(item_id)
    return children


@router.post("/items", response_model=ChecklistItemResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    item_data: ChecklistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new checklist item"""
    service = ChecklistService(db)

    try:
        item = await service.create_item(item_data)
        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/items/{item_id}", response_model=ChecklistItemResponse)
async def update_checklist_item(
    item_id: UUID,
    item_data: ChecklistItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update checklist item"""
    service = ChecklistService(db)
    item = await service.update_item(item_id, item_data)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist item not found",
        )

    return item


@router.post("/items/{item_id}/toggle", response_model=ChecklistItemResponse)
async def toggle_checklist_item(
    item_id: UUID,
    toggle_data: ChecklistItemToggle,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Toggle checklist item completion status"""
    service = ChecklistService(db)
    item = await service.toggle_item(item_id, toggle_data.is_completed)

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist item not found",
        )

    return item


@router.post("/items/{item_id}/move", response_model=ChecklistItemResponse)
async def move_checklist_item(
    item_id: UUID,
    move_data: ChecklistItemMove,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Move checklist item to new parent and position"""
    service = ChecklistService(db)

    try:
        item = await service.move_item(
            item_id, move_data.new_parent_id, move_data.new_position
        )

        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Checklist item not found",
            )

        return item
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete checklist item (cascade deletes all children)"""
    service = ChecklistService(db)
    success = await service.delete_item(item_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Checklist item not found",
        )

    return None
