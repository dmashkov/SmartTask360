"""
SmartTask360 — Notification router (API endpoints)
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.core.types import NotificationType
from app.modules.notifications.schemas import (
    NotificationMarkAllRead,
    NotificationMarkRead,
    NotificationResponse,
    NotificationSettingsResponse,
    NotificationSettingsUpdate,
    NotificationWithActor,
    UnreadCount,
)
from app.modules.notifications.service import NotificationService
from app.modules.users.models import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


# =============================================================================
# Notification Endpoints
# =============================================================================


@router.get("", response_model=list[NotificationWithActor])
async def list_notifications(
    unread_only: bool = Query(False, description="Only show unread notifications"),
    notification_type: str | None = Query(None, description="Filter by type"),
    entity_type: str | None = Query(None, description="Filter by entity type"),
    entity_id: UUID | None = Query(None, description="Filter by entity ID"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List notifications for current user.
    Supports filtering by type, entity, and read status.
    """
    service = NotificationService(db)

    # Parse notification type
    notif_type = None
    if notification_type:
        try:
            notif_type = NotificationType(notification_type)
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid notification type: {notification_type}"
            )

    notifications = await service.get_notifications_for_user(
        user_id=current_user.id,
        unread_only=unread_only,
        notification_type=notif_type,
        entity_type=entity_type,
        entity_id=entity_id,
        skip=skip,
        limit=limit,
    )

    # Enrich with actor details
    result = []
    for n in notifications:
        actor_name = None
        actor_email = None

        if n.actor_id:
            actor_result = await db.execute(
                select(User).where(User.id == n.actor_id)
            )
            actor = actor_result.scalar_one_or_none()
            if actor:
                actor_name = actor.name
                actor_email = actor.email

        result.append(
            NotificationWithActor(
                id=n.id,
                user_id=n.user_id,
                type=n.type,
                title=n.title,
                content=n.content,
                entity_type=n.entity_type,
                entity_id=n.entity_id,
                actor_id=n.actor_id,
                is_read=n.is_read,
                priority=n.priority,
                group_key=n.group_key,
                extra_data=n.extra_data,
                created_at=n.created_at,
                read_at=n.read_at,
                actor_name=actor_name,
                actor_email=actor_email,
            )
        )

    return result


@router.get("/unread-count", response_model=UnreadCount)
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get count of unread notifications"""
    service = NotificationService(db)
    return await service.get_unread_count(current_user.id)


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific notification"""
    service = NotificationService(db)
    notification = await service.get_notification_by_id(notification_id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return NotificationResponse.model_validate(notification)


@router.post("/mark-read")
async def mark_notifications_read(
    data: NotificationMarkRead,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark specific notifications as read"""
    service = NotificationService(db)
    count = await service.mark_as_read(data.notification_ids, current_user.id)
    return {"marked_read": count}


@router.post("/mark-all-read")
async def mark_all_notifications_read(
    data: NotificationMarkAllRead = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all notifications as read (optionally filtered)"""
    service = NotificationService(db)

    notif_type = None
    entity_type = None
    entity_id = None

    if data:
        notif_type = data.type
        entity_type = data.entity_type
        entity_id = data.entity_id

    count = await service.mark_all_as_read(
        user_id=current_user.id,
        notification_type=notif_type,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    return {"marked_read": count}


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a notification"""
    service = NotificationService(db)
    deleted = await service.delete_notification(notification_id, current_user.id)

    if not deleted:
        raise HTTPException(status_code=404, detail="Notification not found")


@router.delete("/old/{days}", status_code=200)
async def delete_old_notifications(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete notifications older than specified days"""
    if days < 1 or days > 365:
        raise HTTPException(status_code=400, detail="Days must be between 1 and 365")

    service = NotificationService(db)
    count = await service.delete_old_notifications(current_user.id, days)
    return {"deleted": count}


# =============================================================================
# Settings Endpoints
# =============================================================================


@router.get("/settings/me", response_model=NotificationSettingsResponse)
async def get_my_settings(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get notification settings for current user"""
    service = NotificationService(db)
    settings = await service.get_or_create_settings(current_user.id)
    return NotificationSettingsResponse.model_validate(settings)


@router.patch("/settings/me", response_model=NotificationSettingsResponse)
async def update_my_settings(
    data: NotificationSettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update notification settings for current user"""
    service = NotificationService(db)
    settings = await service.update_settings(current_user.id, data)
    return NotificationSettingsResponse.model_validate(settings)
