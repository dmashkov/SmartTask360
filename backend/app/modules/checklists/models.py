"""
SmartTask360 — Checklist models
"""

from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Checklist(Base):
    """
    Checklist model — named checklist attached to a task
    A task can have multiple checklists (e.g., "Pre-flight checks", "Review checklist")
    """

    __tablename__ = "checklists"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    task_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    items: Mapped[list["ChecklistItem"]] = relationship(
        "ChecklistItem",
        back_populates="checklist",
        cascade="all, delete-orphan",
        order_by="ChecklistItem.path",
    )


class ChecklistItem(Base):
    """
    Checklist item model with hierarchical structure using ltree
    Supports nested items (subitems) with unlimited depth
    """

    __tablename__ = "checklist_items"

    id: Mapped[UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid4)
    checklist_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("checklists.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    parent_id: Mapped[UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("checklist_items.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    # Hierarchy using ltree
    path: Mapped[str] = mapped_column(
        Text, nullable=False, index=True
    )  # ltree path: "id.child_id.grandchild_id"
    depth: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, index=True
    )  # 0 = root level

    # Content
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Ordering within same level
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    created_at: Mapped[datetime] = mapped_column(nullable=False, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    completed_at: Mapped[datetime | None] = mapped_column(nullable=True)

    # Relationships
    checklist: Mapped["Checklist"] = relationship("Checklist", back_populates="items")
    parent: Mapped["ChecklistItem | None"] = relationship(
        "ChecklistItem", remote_side=[id], back_populates="children"
    )
    children: Mapped[list["ChecklistItem"]] = relationship(
        "ChecklistItem",
        back_populates="parent",
        cascade="all, delete-orphan",
        order_by="ChecklistItem.position",
    )
