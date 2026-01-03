"""
SmartTask360 — Board models (Kanban boards)
"""

from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Board(Base):
    """
    Kanban board - visual representation of tasks in columns.

    Boards can be linked to a project or department.
    Each board can have its own workflow template.
    """

    __tablename__ = "boards"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Owner (creator)
    owner_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Optional project/department link
    project_id: Mapped[UUID | None] = mapped_column(nullable=True, index=True)
    department_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Workflow template for status sync
    workflow_template_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("workflow_templates.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    # Privacy setting
    is_private: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_archived: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, index=True
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<Board {self.name}>"


class BoardColumn(Base):
    """
    Column in a Kanban board.

    Columns can optionally be mapped to task statuses.
    WIP (Work In Progress) limit can be set per column.
    """

    __tablename__ = "board_columns"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    board_id: Mapped[UUID] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Optional status mapping - when task moves to this column, its status changes
    mapped_status: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Display settings
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)  # hex color

    # WIP limit (0 = no limit)
    wip_limit: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # Collapse setting for UI
    is_collapsed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    # Metadata
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )
    updated_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Note: order_index is NOT unique to allow reordering without conflicts

    def __repr__(self) -> str:
        return f"<BoardColumn {self.name} (order={self.order_index})>"


class BoardTask(Base):
    """
    Placement of a task on a board.

    A task can be on multiple boards (e.g., project board and personal board).
    Position is tracked per column for ordering.
    """

    __tablename__ = "board_tasks"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    board_id: Mapped[UUID] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    task_id: Mapped[UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    column_id: Mapped[UUID] = mapped_column(
        ForeignKey("board_columns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Position within column
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # When task was added to board
    added_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )
    # When task was last moved
    moved_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint("board_id", "task_id", name="uq_board_task"),
    )

    def __repr__(self) -> str:
        return f"<BoardTask board={self.board_id} task={self.task_id}>"


class BoardMember(Base):
    """
    Board membership - who has access to the board and with what role.

    Roles:
    - viewer: can view board, cannot modify
    - member: can add/move tasks
    - admin: full control including board settings
    """

    __tablename__ = "board_members"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    board_id: Mapped[UUID] = mapped_column(
        ForeignKey("boards.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Role: viewer, member, admin
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="member")

    # When user was added
    added_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )

    __table_args__ = (
        UniqueConstraint("board_id", "user_id", name="uq_board_member"),
    )

    def __repr__(self) -> str:
        return f"<BoardMember board={self.board_id} user={self.user_id} role={self.role}>"
