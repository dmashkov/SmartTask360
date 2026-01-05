"""
SmartTask360 — User Views Models
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class UserView(Base):
    """Saved filter view for quick access to common task filters."""

    __tablename__ = "user_views"

    id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PGUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # JSON object with filter configuration
    # Example: {"status": ["new", "in_progress"], "assignee_id": "uuid", "is_overdue": true}
    filters: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    # View type: "task" for task list views (extensible for future: "board", "project", etc.)
    view_type: Mapped[str] = mapped_column(String(50), nullable=False, default="task")

    # Is this the default view for the user (auto-applied on page load)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Display order for sorting in dropdown
    sort_order: Mapped[int] = mapped_column(default=0, nullable=False)

    # Icon/color for visual distinction (optional)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    user = relationship("User", back_populates="views")

    def __repr__(self) -> str:
        return f"<UserView {self.name} (user={self.user_id})>"
