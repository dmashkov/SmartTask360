"""
SmartTask360 — User Views Service
"""

from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.views.models import UserView
from app.modules.views.schemas import UserViewCreate, UserViewUpdate


class ViewService:
    """Service for managing user saved views."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_views(
        self,
        user_id: UUID,
        view_type: str = "task",
    ) -> list[UserView]:
        """Get all views for a user, ordered by sort_order."""
        query = (
            select(UserView)
            .where(UserView.user_id == user_id)
            .where(UserView.view_type == view_type)
            .order_by(UserView.sort_order, UserView.created_at)
        )
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def get_view_by_id(self, view_id: UUID, user_id: UUID) -> UserView | None:
        """Get a specific view by ID (must belong to user)."""
        query = select(UserView).where(
            UserView.id == view_id,
            UserView.user_id == user_id,
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_default_view(
        self,
        user_id: UUID,
        view_type: str = "task",
    ) -> UserView | None:
        """Get the default view for a user."""
        query = select(UserView).where(
            UserView.user_id == user_id,
            UserView.view_type == view_type,
            UserView.is_default == True,  # noqa: E712
        )
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def create_view(self, user_id: UUID, data: UserViewCreate) -> UserView:
        """Create a new saved view."""
        # If this is set as default, clear other defaults
        if data.is_default:
            await self._clear_default_views(user_id, data.view_type)

        # Get max sort_order for user
        max_order_query = select(UserView.sort_order).where(
            UserView.user_id == user_id,
            UserView.view_type == data.view_type,
        ).order_by(UserView.sort_order.desc()).limit(1)
        result = await self.db.execute(max_order_query)
        max_order = result.scalar_one_or_none() or 0

        view = UserView(
            user_id=user_id,
            name=data.name,
            filters=data.filters,
            view_type=data.view_type,
            is_default=data.is_default,
            sort_order=max_order + 1,
            icon=data.icon,
            color=data.color,
        )
        self.db.add(view)
        await self.db.commit()
        await self.db.refresh(view)
        return view

    async def update_view(
        self,
        view_id: UUID,
        user_id: UUID,
        data: UserViewUpdate,
    ) -> UserView | None:
        """Update an existing view."""
        view = await self.get_view_by_id(view_id, user_id)
        if not view:
            return None

        # If setting as default, clear other defaults
        if data.is_default is True:
            await self._clear_default_views(user_id, view.view_type)

        update_data = data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(view, field, value)

        await self.db.commit()
        await self.db.refresh(view)
        return view

    async def delete_view(self, view_id: UUID, user_id: UUID) -> bool:
        """Delete a view."""
        view = await self.get_view_by_id(view_id, user_id)
        if not view:
            return False

        await self.db.delete(view)
        await self.db.commit()
        return True

    async def reorder_views(self, user_id: UUID, view_ids: list[UUID]) -> list[UserView]:
        """Reorder views by updating sort_order."""
        for index, view_id in enumerate(view_ids):
            await self.db.execute(
                update(UserView)
                .where(UserView.id == view_id, UserView.user_id == user_id)
                .values(sort_order=index)
            )
        await self.db.commit()
        return await self.get_user_views(user_id)

    async def _clear_default_views(self, user_id: UUID, view_type: str) -> None:
        """Clear default flag from all user views of a type."""
        await self.db.execute(
            update(UserView)
            .where(
                UserView.user_id == user_id,
                UserView.view_type == view_type,
                UserView.is_default == True,  # noqa: E712
            )
            .values(is_default=False)
        )
