"""
SmartTask360 — User Views API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.users.models import User
from app.modules.views.schemas import (
    UserViewCreate,
    UserViewReorder,
    UserViewResponse,
    UserViewUpdate,
)
from app.modules.views.service import ViewService

router = APIRouter(prefix="/views", tags=["views"])


@router.get("/", response_model=list[UserViewResponse])
async def get_views(
    view_type: str = "task",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all saved views for current user."""
    service = ViewService(db)
    views = await service.get_user_views(current_user.id, view_type)
    return views


@router.get("/default", response_model=UserViewResponse | None)
async def get_default_view(
    view_type: str = "task",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the default view for current user."""
    service = ViewService(db)
    view = await service.get_default_view(current_user.id, view_type)
    return view


@router.get("/{view_id}", response_model=UserViewResponse)
async def get_view(
    view_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific view by ID."""
    service = ViewService(db)
    view = await service.get_view_by_id(view_id, current_user.id)
    if not view:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="View not found",
        )
    return view


@router.post("/", response_model=UserViewResponse, status_code=status.HTTP_201_CREATED)
async def create_view(
    data: UserViewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new saved view."""
    service = ViewService(db)
    view = await service.create_view(current_user.id, data)
    return view


@router.put("/{view_id}", response_model=UserViewResponse)
async def update_view(
    view_id: UUID,
    data: UserViewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update an existing view."""
    service = ViewService(db)
    view = await service.update_view(view_id, current_user.id, data)
    if not view:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="View not found",
        )
    return view


@router.delete("/{view_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_view(
    view_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a view."""
    service = ViewService(db)
    deleted = await service.delete_view(view_id, current_user.id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="View not found",
        )


@router.post("/reorder", response_model=list[UserViewResponse])
async def reorder_views(
    data: UserViewReorder,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Reorder views by providing list of view IDs in desired order."""
    service = ViewService(db)
    views = await service.reorder_views(current_user.id, data.view_ids)
    return views
