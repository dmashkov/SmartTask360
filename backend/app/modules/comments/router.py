"""
SmartTask360 — Comments API endpoints
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.comments.schemas import (
    CommentCreate,
    CommentResponse,
    CommentUpdate,
    ReactionCreate,
    ReactionResponse,
    ReactionSummary,
)
from app.modules.comments.service import CommentService, ReactionService
from app.modules.users.models import User

router = APIRouter(prefix="/comments", tags=["comments"])


@router.get("/tasks/{task_id}/comments", response_model=list[CommentResponse])
async def get_task_comments(
    task_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all comments for a task"""
    service = CommentService(db)
    comments = await service.get_task_comments(task_id, skip=skip, limit=limit)
    return comments


@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get comment by ID"""
    service = CommentService(db)
    comment = await service.get_by_id(comment_id)

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    return comment


@router.get("/{comment_id}/replies", response_model=list[CommentResponse])
async def get_comment_replies(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all replies to a comment (threaded comments)"""
    service = CommentService(db)

    # Verify comment exists
    comment = await service.get_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found",
        )

    replies = await service.get_comment_replies(comment_id)
    return replies


@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    comment_data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create new comment"""
    service = CommentService(db)

    try:
        comment = await service.create(comment_data, author_id=current_user.id)
        return comment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update comment (only author can update)"""
    service = CommentService(db)

    try:
        comment = await service.update(comment_id, comment_data, user_id=current_user.id)

        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found",
            )

        return comment
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete comment (only author can delete)"""
    service = CommentService(db)

    try:
        success = await service.delete(comment_id, user_id=current_user.id)

        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found",
            )

        return None
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e),
        )


@router.get("/users/me/comments", response_model=list[CommentResponse])
async def get_my_comments(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all comments by current user"""
    service = CommentService(db)
    comments = await service.get_user_comments(current_user.id, skip=skip, limit=limit)
    return comments


@router.post("/tasks/{task_id}/mark-read")
async def mark_task_comments_as_read(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark all comments on a task as read for the current user"""
    service = CommentService(db)
    marked_count = await service.mark_task_comments_as_read(current_user.id, task_id)
    return {"marked_count": marked_count}


@router.get("/tasks/{task_id}/unread-count")
async def get_task_unread_count(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get unread comments and mentions count for a task"""
    service = CommentService(db)
    counts = await service.get_unread_comments_count(current_user.id, task_id)
    return counts


# Reaction endpoints
@router.get("/{comment_id}/reactions", response_model=list[ReactionSummary])
async def get_comment_reactions(
    comment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get reactions summary for a comment"""
    service = ReactionService(db)
    reactions = await service.get_comment_reactions_summary(comment_id, current_user.id)
    return reactions


@router.post("/{comment_id}/reactions", response_model=ReactionResponse, status_code=status.HTTP_201_CREATED)
async def add_reaction(
    comment_id: UUID,
    reaction_data: ReactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Add or toggle a reaction to a comment"""
    service = ReactionService(db)

    try:
        reaction = await service.toggle_reaction(
            comment_id=comment_id,
            user_id=current_user.id,
            emoji=reaction_data.emoji
        )

        if not reaction:
            # Reaction was removed (toggle off)
            raise HTTPException(
                status_code=status.HTTP_204_NO_CONTENT,
                detail="Reaction removed",
            )

        return reaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.delete("/{comment_id}/reactions/{emoji}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_reaction(
    comment_id: UUID,
    emoji: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Remove a specific reaction"""
    service = ReactionService(db)

    success = await service.remove_reaction(
        comment_id=comment_id,
        user_id=current_user.id,
        emoji=emoji
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reaction not found",
        )

    return None
