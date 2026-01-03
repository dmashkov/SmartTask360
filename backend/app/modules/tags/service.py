"""
SmartTask360 — Tag service (business logic)
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.tags.models import Tag, task_tags
from app.modules.tags.schemas import TagCreate, TagUpdate


class TagService:
    """Service for tag operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, tag_id: UUID) -> Tag | None:
        """Get tag by ID"""
        result = await self.db.execute(select(Tag).where(Tag.id == tag_id))
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> Tag | None:
        """Get tag by name"""
        result = await self.db.execute(select(Tag).where(Tag.name == name))
        return result.scalar_one_or_none()

    async def get_all(
        self, skip: int = 0, limit: int = 100, active_only: bool = True
    ) -> list[Tag]:
        """Get all tags"""
        query = select(Tag)

        if active_only:
            query = query.where(Tag.is_active == True)

        query = query.order_by(Tag.name).offset(skip).limit(limit)

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def create(self, tag_data: TagCreate) -> Tag:
        """Create new tag"""
        # Check if tag with this name already exists
        existing = await self.get_by_name(tag_data.name)
        if existing:
            if existing.is_active:
                raise ValueError(f"Tag '{tag_data.name}' already exists")
            else:
                # Reactivate soft-deleted tag
                existing.is_active = True
                existing.color = tag_data.color
                await self.db.commit()
                await self.db.refresh(existing)
                return existing

        # Create new tag
        tag = Tag(
            name=tag_data.name,
            color=tag_data.color,
        )
        self.db.add(tag)
        await self.db.commit()
        await self.db.refresh(tag)
        return tag

    async def update(self, tag_id: UUID, tag_data: TagUpdate) -> Tag | None:
        """Update tag"""
        tag = await self.get_by_id(tag_id)
        if not tag:
            return None

        # Check for name conflicts
        if tag_data.name and tag_data.name != tag.name:
            existing = await self.get_by_name(tag_data.name)
            if existing and existing.id != tag_id:
                raise ValueError(f"Tag '{tag_data.name}' already exists")

        # Update fields
        update_data = tag_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(tag, field, value)

        await self.db.commit()
        await self.db.refresh(tag)
        return tag

    async def delete(self, tag_id: UUID) -> bool:
        """Soft delete tag (set is_active = False)"""
        tag = await self.get_by_id(tag_id)
        if not tag:
            return False

        tag.is_active = False
        await self.db.commit()
        return True

    async def get_task_tags(self, task_id: UUID) -> list[Tag]:
        """Get all tags assigned to a task"""
        result = await self.db.execute(
            select(Tag)
            .join(task_tags, Tag.id == task_tags.c.tag_id)
            .where(task_tags.c.task_id == task_id)
            .where(Tag.is_active == True)
            .order_by(Tag.name)
        )
        return list(result.scalars().all())

    async def assign_tags_to_task(self, task_id: UUID, tag_ids: list[UUID]) -> list[Tag]:
        """
        Assign tags to a task (replaces existing tags).
        Returns the list of assigned tags.
        """
        # Remove all existing tags
        await self.db.execute(task_tags.delete().where(task_tags.c.task_id == task_id))

        # Add new tags
        if tag_ids:
            # Verify all tags exist
            for tag_id in tag_ids:
                tag = await self.get_by_id(tag_id)
                if not tag:
                    raise ValueError(f"Tag {tag_id} not found")
                if not tag.is_active:
                    raise ValueError(f"Tag {tag_id} is inactive")

            # Insert new assignments
            for tag_id in tag_ids:
                await self.db.execute(
                    task_tags.insert().values(task_id=task_id, tag_id=tag_id)
                )

        await self.db.commit()

        # Return assigned tags
        return await self.get_task_tags(task_id)

    async def add_tag_to_task(self, task_id: UUID, tag_id: UUID) -> bool:
        """Add a single tag to a task"""
        # Check if tag exists and is active
        tag = await self.get_by_id(tag_id)
        if not tag or not tag.is_active:
            raise ValueError(f"Tag {tag_id} not found or inactive")

        # Check if already assigned
        result = await self.db.execute(
            select(task_tags).where(
                task_tags.c.task_id == task_id, task_tags.c.tag_id == tag_id
            )
        )
        if result.first():
            return False  # Already assigned

        # Add tag
        await self.db.execute(task_tags.insert().values(task_id=task_id, tag_id=tag_id))
        await self.db.commit()
        return True

    async def remove_tag_from_task(self, task_id: UUID, tag_id: UUID) -> bool:
        """Remove a tag from a task"""
        result = await self.db.execute(
            task_tags.delete().where(
                task_tags.c.task_id == task_id, task_tags.c.tag_id == tag_id
            )
        )
        await self.db.commit()
        return result.rowcount > 0
