"""
SmartTask360 — Comment service (business logic)
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.comments.models import Comment
from app.modules.comments.schemas import CommentCreate, CommentUpdate
from app.modules.task_history.service import TaskHistoryService
from app.modules.task_history.schemas import TaskHistoryCreate


class CommentService:
    """Service for comment operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, comment_id: UUID) -> Comment | None:
        """Get comment by ID"""
        result = await self.db.execute(select(Comment).where(Comment.id == comment_id))
        return result.scalar_one_or_none()

    async def get_task_comments(
        self, task_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Comment]:
        """Get all comments for a task (ordered by creation time)"""
        result = await self.db.execute(
            select(Comment)
            .where(Comment.task_id == task_id)
            .order_by(Comment.created_at)
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_comment_replies(self, comment_id: UUID) -> list[Comment]:
        """Get all replies to a comment (threaded comments)"""
        result = await self.db.execute(
            select(Comment)
            .where(Comment.reply_to_id == comment_id)
            .order_by(Comment.created_at)
        )
        return list(result.scalars().all())

    async def create(
        self, comment_data: CommentCreate, author_id: UUID, author_type: str = "user"
    ) -> Comment:
        """Create new comment"""
        # Validate reply_to_id if provided
        if comment_data.reply_to_id:
            parent_comment = await self.get_by_id(comment_data.reply_to_id)
            if not parent_comment:
                raise ValueError(f"Parent comment {comment_data.reply_to_id} not found")
            # Ensure reply is on the same task
            if parent_comment.task_id != comment_data.task_id:
                raise ValueError("Reply must be on the same task as parent comment")

        comment = Comment(
            task_id=comment_data.task_id,
            author_id=author_id,
            author_type=author_type,
            content=comment_data.content,
            reply_to_id=comment_data.reply_to_id,
        )

        self.db.add(comment)
        await self.db.flush()

        # Record history entry for comment creation
        history_service = TaskHistoryService(self.db)
        await history_service.create_entry(
            TaskHistoryCreate(
                task_id=comment_data.task_id,
                user_id=author_id,
                action="commented",
                field_name=None,
                old_value=None,
                new_value=None,
                extra_data={"comment_id": str(comment.id)},
            )
        )

        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def update(
        self, comment_id: UUID, comment_data: CommentUpdate, user_id: UUID
    ) -> Comment | None:
        """Update comment (only author can update)"""
        comment = await self.get_by_id(comment_id)
        if not comment:
            return None

        # Only author can update their comment
        if comment.author_id != user_id:
            raise ValueError("Only comment author can update the comment")

        # Update content
        comment.content = comment_data.content

        await self.db.commit()
        await self.db.refresh(comment)
        return comment

    async def delete(self, comment_id: UUID, user_id: UUID) -> bool:
        """Delete comment (only author can delete)"""
        comment = await self.get_by_id(comment_id)
        if not comment:
            return False

        # Only author can delete their comment
        if comment.author_id != user_id:
            raise ValueError("Only comment author can delete the comment")

        # Hard delete (comments are not soft-deleted in this version)
        await self.db.delete(comment)
        await self.db.commit()
        return True

    async def get_user_comments(
        self, user_id: UUID, skip: int = 0, limit: int = 100
    ) -> list[Comment]:
        """Get all comments by a specific user"""
        result = await self.db.execute(
            select(Comment)
            .where(Comment.author_id == user_id)
            .order_by(Comment.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())
