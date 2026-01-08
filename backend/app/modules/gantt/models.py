"""
SmartTask360 — Gantt Chart Models

TaskDependency: Links between tasks (predecessor/successor)
TaskBaseline: Snapshots of planned dates for plan/fact comparison
"""

from datetime import datetime
from decimal import Decimal
from uuid import UUID, uuid4

from sqlalchemy import DECIMAL, ForeignKey, String, UniqueConstraint, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TaskDependency(Base):
    """
    Task dependency model - represents predecessor/successor relationships.

    Dependency types:
    - FS (Finish-to-Start): Successor starts when predecessor finishes (most common)
    - SS (Start-to-Start): Tasks start together
    - FF (Finish-to-Finish): Tasks finish together
    - SF (Start-to-Finish): Successor finishes when predecessor starts (rare)

    lag_days:
    - Positive: delay between tasks (e.g., +2 = wait 2 days after predecessor)
    - Negative: lead time (overlap allowed)
    """

    __tablename__ = "task_dependencies"
    __table_args__ = (
        UniqueConstraint(
            "predecessor_id", "successor_id", name="uq_task_dependency"
        ),
        CheckConstraint(
            "predecessor_id != successor_id", name="ck_no_self_dependency"
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    # The task that must complete first (or start first for SS/SF)
    predecessor_id: Mapped[UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # The task that depends on the predecessor
    successor_id: Mapped[UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Dependency type: FS, SS, FF, SF
    dependency_type: Mapped[str] = mapped_column(
        String(2),
        nullable=False,
        default="FS",
    )

    # Lag time in days (positive = delay, negative = lead)
    lag_days: Mapped[int] = mapped_column(nullable=False, default=0)

    # Audit fields
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )
    created_by: Mapped[UUID | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        return f"<Dependency {self.predecessor_id} -> {self.successor_id} ({self.dependency_type})>"


class TaskBaseline(Base):
    """
    Task baseline model - snapshots of planned dates for plan/fact comparison.

    Allows tracking multiple baseline versions (e.g., initial plan, revision 1, etc.)
    """

    __tablename__ = "task_baselines"
    __table_args__ = (
        UniqueConstraint(
            "task_id", "baseline_number", name="uq_task_baseline_number"
        ),
    )

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)

    task_id: Mapped[UUID] = mapped_column(
        ForeignKey("tasks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Baseline version number (1, 2, 3...)
    baseline_number: Mapped[int] = mapped_column(nullable=False, default=1)

    # Optional name for this baseline
    baseline_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Snapshot of planned dates at baseline time
    planned_start_date: Mapped[datetime | None] = mapped_column(nullable=True)
    planned_end_date: Mapped[datetime | None] = mapped_column(nullable=True)

    # Snapshot of estimated hours
    estimated_hours: Mapped[Decimal | None] = mapped_column(
        DECIMAL(10, 2), nullable=True
    )

    # Audit fields
    created_at: Mapped[datetime] = mapped_column(
        nullable=False, default=datetime.utcnow
    )
    created_by: Mapped[UUID | None] = mapped_column(nullable=True)

    def __repr__(self) -> str:
        name = self.baseline_name or f"Baseline #{self.baseline_number}"
        return f"<TaskBaseline {self.task_id}: {name}>"
