"""
SmartTask360 — Checklist service (business logic)
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import Integer, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.checklists.models import Checklist, ChecklistItem
from app.modules.checklists.schemas import (
    ChecklistCreate,
    ChecklistItemCreate,
    ChecklistItemUpdate,
    ChecklistStatsResponse,
    ChecklistUpdate,
)


class ChecklistService:
    """Service for checklist operations"""

    def __init__(self, db: AsyncSession):
        self.db = db

    # ========== Checklist CRUD ==========

    async def get_checklist_by_id(self, checklist_id: UUID) -> Checklist | None:
        """Get checklist by ID"""
        result = await self.db.execute(
            select(Checklist).where(Checklist.id == checklist_id)
        )
        return result.scalar_one_or_none()

    async def get_checklist_with_items(self, checklist_id: UUID) -> Checklist | None:
        """Get checklist with all items loaded"""
        result = await self.db.execute(
            select(Checklist)
            .where(Checklist.id == checklist_id)
            .options(selectinload(Checklist.items))
        )
        return result.scalar_one_or_none()

    async def get_task_checklists(self, task_id: UUID) -> list[Checklist]:
        """Get all checklists for a task (ordered by position)"""
        result = await self.db.execute(
            select(Checklist)
            .where(Checklist.task_id == task_id)
            .order_by(Checklist.position, Checklist.created_at)
        )
        return list(result.scalars().all())

    async def get_task_checklists_with_items(self, task_id: UUID) -> list[Checklist]:
        """Get all checklists for a task with items loaded (ordered by position)"""
        result = await self.db.execute(
            select(Checklist)
            .where(Checklist.task_id == task_id)
            .options(selectinload(Checklist.items))
            .order_by(Checklist.position, Checklist.created_at)
        )
        return list(result.scalars().all())

    async def create_checklist(self, checklist_data: ChecklistCreate) -> Checklist:
        """Create new checklist"""
        checklist = Checklist(
            task_id=checklist_data.task_id,
            title=checklist_data.title,
            position=checklist_data.position,
        )

        self.db.add(checklist)
        await self.db.commit()
        await self.db.refresh(checklist)
        return checklist

    async def update_checklist(
        self, checklist_id: UUID, checklist_data: ChecklistUpdate
    ) -> Checklist | None:
        """Update checklist"""
        checklist = await self.get_checklist_by_id(checklist_id)
        if not checklist:
            return None

        checklist.title = checklist_data.title
        checklist.position = checklist_data.position

        await self.db.commit()
        await self.db.refresh(checklist)
        return checklist

    async def delete_checklist(self, checklist_id: UUID) -> bool:
        """Delete checklist (cascade deletes all items)"""
        checklist = await self.get_checklist_by_id(checklist_id)
        if not checklist:
            return False

        await self.db.delete(checklist)
        await self.db.commit()
        return True

    # ========== Checklist Item CRUD ==========

    async def get_item_by_id(self, item_id: UUID) -> ChecklistItem | None:
        """Get checklist item by ID"""
        result = await self.db.execute(
            select(ChecklistItem).where(ChecklistItem.id == item_id)
        )
        return result.scalar_one_or_none()

    async def get_checklist_items(self, checklist_id: UUID) -> list[ChecklistItem]:
        """Get all items for a checklist (ordered by path for hierarchical display)"""
        result = await self.db.execute(
            select(ChecklistItem)
            .where(ChecklistItem.checklist_id == checklist_id)
            .order_by(ChecklistItem.path)
        )
        return list(result.scalars().all())

    async def get_item_children(self, item_id: UUID) -> list[ChecklistItem]:
        """Get direct children of an item"""
        result = await self.db.execute(
            select(ChecklistItem)
            .where(ChecklistItem.parent_id == item_id)
            .order_by(ChecklistItem.position)
        )
        return list(result.scalars().all())

    async def create_item(self, item_data: ChecklistItemCreate) -> ChecklistItem:
        """Create new checklist item with ltree path"""
        # Validate parent if provided
        parent_item = None
        if item_data.parent_id:
            parent_item = await self.get_item_by_id(item_data.parent_id)
            if not parent_item:
                raise ValueError(f"Parent item {item_data.parent_id} not found")
            # Ensure parent is in the same checklist
            if parent_item.checklist_id != item_data.checklist_id:
                raise ValueError("Parent item must be in the same checklist")

        # Calculate position: append to end of siblings (max position + 1)
        max_position_result = await self.db.execute(
            select(func.max(ChecklistItem.position)).where(
                ChecklistItem.checklist_id == item_data.checklist_id,
                ChecklistItem.parent_id == item_data.parent_id,
            )
        )
        max_position = max_position_result.scalar()
        new_position = (max_position + 1) if max_position is not None else 0

        # Create item
        item = ChecklistItem(
            checklist_id=item_data.checklist_id,
            parent_id=item_data.parent_id,
            content=item_data.content,
            position=new_position,
            is_completed=False,
            depth=parent_item.depth + 1 if parent_item else 0,
            path="",  # Will be set after flush
        )

        self.db.add(item)
        await self.db.flush()  # Flush to get item.id

        # Set path now that we have item.id
        if parent_item:
            item.path = f"{parent_item.path}.{item.id}"
        else:
            item.path = str(item.id)

        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_item(
        self, item_id: UUID, item_data: ChecklistItemUpdate
    ) -> ChecklistItem | None:
        """Update checklist item"""
        item = await self.get_item_by_id(item_id)
        if not item:
            return None

        item.content = item_data.content
        item.position = item_data.position

        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def toggle_item(self, item_id: UUID, is_completed: bool) -> ChecklistItem | None:
        """Toggle item completion status"""
        item = await self.get_item_by_id(item_id)
        if not item:
            return None

        item.is_completed = is_completed
        item.completed_at = datetime.utcnow() if is_completed else None

        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete_item(self, item_id: UUID) -> bool:
        """Delete checklist item (cascade deletes all children)"""
        item = await self.get_item_by_id(item_id)
        if not item:
            return False

        await self.db.delete(item)
        await self.db.commit()
        return True

    async def move_item(
        self, item_id: UUID, new_parent_id: UUID | None, new_position: int
    ) -> ChecklistItem | None:
        """
        Move item to new parent (or root) and update positions of siblings.
        Uses array-based reordering for flat structure.
        """
        item = await self.get_item_by_id(item_id)
        if not item:
            return None

        # Validate new parent
        new_parent = None
        if new_parent_id:
            new_parent = await self.get_item_by_id(new_parent_id)
            if not new_parent:
                raise ValueError(f"New parent {new_parent_id} not found")
            # Prevent moving to own descendant
            if new_parent.path.startswith(item.path):
                raise ValueError("Cannot move item to its own descendant")
            # Ensure same checklist
            if new_parent.checklist_id != item.checklist_id:
                raise ValueError("Cannot move item to different checklist")

        old_path = item.path
        old_position = item.position
        old_parent_id = item.parent_id

        # Get all siblings at the target level (same parent)
        siblings_query = select(ChecklistItem).where(
            ChecklistItem.checklist_id == item.checklist_id,
            ChecklistItem.parent_id == new_parent_id,
        ).order_by(ChecklistItem.position)

        siblings_result = await self.db.execute(siblings_query)
        siblings = list(siblings_result.scalars().all())

        # If moving within same parent, reorder in place
        if old_parent_id == new_parent_id:
            # Remove item from current position and insert at new position
            siblings_without_item = [s for s in siblings if s.id != item.id]

            # Clamp new_position to valid range
            new_position = max(0, min(new_position, len(siblings_without_item)))

            # Insert item at new position
            siblings_without_item.insert(new_position, item)

            # Update positions for all siblings
            for idx, sibling in enumerate(siblings_without_item):
                sibling.position = idx
        else:
            # Moving to different parent
            # First, update positions in old parent's children
            old_siblings_query = select(ChecklistItem).where(
                ChecklistItem.checklist_id == item.checklist_id,
                ChecklistItem.parent_id == old_parent_id,
                ChecklistItem.id != item.id,
            ).order_by(ChecklistItem.position)

            old_siblings_result = await self.db.execute(old_siblings_query)
            old_siblings = list(old_siblings_result.scalars().all())

            # Reindex old siblings
            for idx, sibling in enumerate(old_siblings):
                sibling.position = idx

            # Add item to new parent's children
            new_siblings = [s for s in siblings if s.id != item.id]
            new_position = max(0, min(new_position, len(new_siblings)))
            new_siblings.insert(new_position, item)

            # Update positions for new siblings
            for idx, sibling in enumerate(new_siblings):
                sibling.position = idx

        # Update parent reference
        item.parent_id = new_parent_id

        # Update depth and path
        if new_parent:
            item.depth = new_parent.depth + 1
            new_path = f"{new_parent.path}.{item.id}"
        else:
            item.depth = 0
            new_path = str(item.id)

        item.path = new_path

        # Update paths of all descendants (if item had children)
        if old_path != new_path:
            descendants = await self.db.execute(
                select(ChecklistItem).where(
                    ChecklistItem.path.like(f"{old_path}.%")
                )
            )
            for descendant in descendants.scalars().all():
                # Replace old path prefix with new path
                descendant.path = descendant.path.replace(old_path, new_path, 1)
                # Update depth
                descendant.depth = descendant.path.count(".")

        await self.db.commit()
        await self.db.refresh(item)
        return item

    # ========== Statistics ==========

    async def get_checklist_stats(self, checklist_id: UUID) -> ChecklistStatsResponse:
        """Get completion statistics for a checklist"""
        result = await self.db.execute(
            select(
                func.count(ChecklistItem.id).label("total"),
                func.sum(func.cast(ChecklistItem.is_completed, Integer)).label("completed"),
            ).where(ChecklistItem.checklist_id == checklist_id)
        )

        row = result.one()
        total = row.total or 0
        completed = row.completed or 0
        percentage = (completed / total * 100) if total > 0 else 0.0

        return ChecklistStatsResponse(
            checklist_id=checklist_id,
            total_items=total,
            completed_items=completed,
            completion_percentage=round(percentage, 2),
        )
