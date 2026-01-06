"""
SmartTask360 — Comment service (business logic)
"""

import re
from uuid import UUID
from collections import defaultdict
from datetime import datetime

from sqlalchemy import select, delete, func, insert, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.comments.models import Comment, comment_read_status
from app.modules.comments.reactions import CommentReaction
from app.modules.comments.schemas import CommentCreate, CommentUpdate, ReactionSummary
from app.modules.task_history.service import TaskHistoryService
from app.modules.task_history.schemas import TaskHistoryCreate
from app.modules.users.models import User


# Pattern to match @Имя Фамилия or @Имя (Cyrillic names)
MENTION_PATTERN = re.compile(r'@([А-Яа-яЁёA-Za-z]+(?:\s+[А-Яа-яЁёA-Za-z]+)?)', re.UNICODE)


class CommentService:
    """Service for comment operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, comment_id: UUID) -> Comment | None:
        """Get comment by ID"""
        result = await self.db.execute(select(Comment).where(Comment.id == comment_id))
        return result.scalar_one_or_none()

    async def _find_users_by_names(self, names: list[str]) -> dict[str, UUID]:
        """
        Find users by name (case-insensitive).
        Returns dict: {normalized_name: user_id}
        """
        if not names:
            return {}

        # Build conditions for each name
        conditions = []
        for name in names:
            name_lower = name.lower().strip()
            conditions.append(func.lower(User.name) == name_lower)

        result = await self.db.execute(
            select(User.id, User.name)
            .where(User.is_active == True)
            .where(or_(*conditions))
        )

        # Build map: lowercase name -> user_id
        name_to_id = {}
        for user_id, user_name in result.all():
            name_to_id[user_name.lower()] = user_id

        return name_to_id

    def _extract_mentions(self, content: str) -> list[str]:
        """Extract @mentions from text content."""
        matches = MENTION_PATTERN.findall(content)
        # Normalize: strip extra spaces
        return [m.strip() for m in matches if m.strip()]

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
        """Create new comment with @mention support"""
        # Validate reply_to_id if provided
        if comment_data.reply_to_id:
            parent_comment = await self.get_by_id(comment_data.reply_to_id)
            if not parent_comment:
                raise ValueError(f"Parent comment {comment_data.reply_to_id} not found")
            # Ensure reply is on the same task
            if parent_comment.task_id != comment_data.task_id:
                raise ValueError("Reply must be on the same task as parent comment")

        # Extract @mentions from content
        mentioned_names = self._extract_mentions(comment_data.content)
        mentioned_user_ids = []

        if mentioned_names:
            # Find users by name
            name_to_id = await self._find_users_by_names(mentioned_names)
            for name in mentioned_names:
                user_id = name_to_id.get(name.lower())
                if user_id and user_id not in mentioned_user_ids:
                    mentioned_user_ids.append(user_id)

        comment = Comment(
            task_id=comment_data.task_id,
            author_id=author_id,
            author_type=author_type,
            content=comment_data.content,
            mentioned_user_ids=mentioned_user_ids if mentioned_user_ids else None,
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

        # Send notifications to mentioned users (after commit)
        if mentioned_user_ids:
            await self._notify_mentioned_users(
                mentioned_user_ids=mentioned_user_ids,
                task_id=comment_data.task_id,
                comment_content=comment_data.content,
                author_id=author_id,
            )

        return comment

    async def _notify_mentioned_users(
        self,
        mentioned_user_ids: list[UUID],
        task_id: UUID,
        comment_content: str,
        author_id: UUID,
    ) -> None:
        """Send notifications to mentioned users."""
        from app.modules.notifications.service import NotificationService
        from app.modules.tasks.models import Task

        # Get task title for notification
        result = await self.db.execute(select(Task.title).where(Task.id == task_id))
        task_title = result.scalar_one_or_none() or "Задача"

        notification_service = NotificationService(self.db)

        for user_id in mentioned_user_ids:
            if user_id != author_id:  # Don't notify yourself
                await notification_service.notify_task_mention(
                    mentioned_user_id=user_id,
                    task_id=task_id,
                    task_title=task_title,
                    mentioner_id=author_id,
                    context=comment_content[:200],
                )

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

    async def mark_comments_as_read(
        self, user_id: UUID, comment_ids: list[UUID]
    ) -> int:
        """Mark comments as read for a user. Returns number of newly marked."""
        if not comment_ids:
            return 0

        # Use insert with on_conflict_do_nothing for idempotency
        from sqlalchemy.dialects.postgresql import insert as pg_insert

        values = [
            {"user_id": user_id, "comment_id": cid, "read_at": datetime.utcnow()}
            for cid in comment_ids
        ]

        stmt = pg_insert(comment_read_status).values(values)
        stmt = stmt.on_conflict_do_nothing()

        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.rowcount

    async def mark_task_comments_as_read(self, user_id: UUID, task_id: UUID) -> int:
        """Mark all comments on a task as read for a user."""
        # Get all comment IDs for the task
        result = await self.db.execute(
            select(Comment.id).where(Comment.task_id == task_id)
        )
        comment_ids = [row[0] for row in result.all()]

        if not comment_ids:
            return 0

        return await self.mark_comments_as_read(user_id, comment_ids)

    async def get_unread_comments_count(
        self, user_id: UUID, task_id: UUID
    ) -> dict:
        """Get count of unread comments and unread mentions for a task."""
        from sqlalchemy import and_, not_

        # Subquery for read comments
        read_subq = select(comment_read_status.c.comment_id).where(
            comment_read_status.c.user_id == user_id
        )

        # Total unread comments
        total_unread_result = await self.db.execute(
            select(func.count(Comment.id)).where(
                Comment.task_id == task_id,
                ~Comment.id.in_(read_subq),
                Comment.author_id != user_id,  # Don't count own comments
            )
        )
        total_unread = total_unread_result.scalar() or 0

        # Unread mentions (comments where user is mentioned and not read)
        unread_mentions_result = await self.db.execute(
            select(func.count(Comment.id)).where(
                Comment.task_id == task_id,
                ~Comment.id.in_(read_subq),
                Comment.mentioned_user_ids.any(user_id),
            )
        )
        unread_mentions = unread_mentions_result.scalar() or 0

        # Total comments
        total_result = await self.db.execute(
            select(func.count(Comment.id)).where(Comment.task_id == task_id)
        )
        total = total_result.scalar() or 0

        return {
            "total": total,
            "unread": total_unread,
            "unread_mentions": unread_mentions,
        }


class ReactionService:
    """Service for comment reaction operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_comment_reactions_summary(
        self, comment_id: UUID, current_user_id: UUID
    ) -> list[ReactionSummary]:
        """Get reactions summary grouped by emoji with counts and user lists"""
        # Query all reactions for this comment
        result = await self.db.execute(
            select(CommentReaction)
            .where(CommentReaction.comment_id == comment_id)
            .order_by(CommentReaction.created_at)
        )
        reactions = result.scalars().all()

        # Group by emoji
        emoji_groups: dict[str, list[UUID]] = defaultdict(list)
        for reaction in reactions:
            emoji_groups[reaction.emoji].append(reaction.user_id)

        # Build summary list
        summaries = []
        for emoji, user_ids in emoji_groups.items():
            summaries.append(
                ReactionSummary(
                    emoji=emoji,
                    count=len(user_ids),
                    user_ids=user_ids,
                    has_current_user=current_user_id in user_ids,
                )
            )

        return summaries

    async def toggle_reaction(
        self, comment_id: UUID, user_id: UUID, emoji: str
    ) -> CommentReaction | None:
        """
        Toggle reaction (add if not exists, remove if exists).
        Returns the created reaction or None if removed.
        """
        # Check if reaction already exists
        result = await self.db.execute(
            select(CommentReaction).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.user_id == user_id,
                CommentReaction.emoji == emoji,
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            # Remove reaction
            await self.db.delete(existing)
            await self.db.commit()
            return None
        else:
            # Add reaction
            from uuid import uuid4
            from datetime import datetime

            reaction = CommentReaction(
                id=uuid4(),
                comment_id=comment_id,
                user_id=user_id,
                emoji=emoji,
                created_at=datetime.utcnow(),
            )
            self.db.add(reaction)
            await self.db.commit()
            await self.db.refresh(reaction)
            return reaction

    async def remove_reaction(
        self, comment_id: UUID, user_id: UUID, emoji: str
    ) -> bool:
        """Remove a specific reaction. Returns True if deleted, False if not found."""
        result = await self.db.execute(
            delete(CommentReaction).where(
                CommentReaction.comment_id == comment_id,
                CommentReaction.user_id == user_id,
                CommentReaction.emoji == emoji,
            )
        )
        await self.db.commit()
        return result.rowcount > 0
