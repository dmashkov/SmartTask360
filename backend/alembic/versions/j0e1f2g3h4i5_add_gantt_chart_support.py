"""Add Gantt chart support - planned dates, dependencies, baselines

Revision ID: j0e1f2g3h4i5
Revises: i9d0e1f2g3h4
Create Date: 2026-01-09

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = "j0e1f2g3h4i5"
down_revision = "i9d0e1f2g3h4"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add planned dates to tasks table
    op.add_column(
        "tasks",
        sa.Column("planned_start_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "tasks",
        sa.Column("planned_end_date", sa.DateTime(timezone=True), nullable=True),
    )

    # Create task_dependencies table
    op.create_table(
        "task_dependencies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "predecessor_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "successor_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "dependency_type",
            sa.String(2),
            nullable=False,
            default="FS",
        ),  # FS (finish-to-start), SS, FF, SF
        sa.Column(
            "lag_days",
            sa.Integer(),
            nullable=False,
            default=0,
        ),  # Positive = delay, negative = lead time
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        # Prevent duplicate dependencies
        sa.UniqueConstraint(
            "predecessor_id", "successor_id", name="uq_task_dependency"
        ),
        # Prevent self-referencing
        sa.CheckConstraint(
            "predecessor_id != successor_id", name="ck_no_self_dependency"
        ),
    )

    # Create task_baselines table for plan/fact comparison
    op.create_table(
        "task_baselines",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "task_id",
            UUID(as_uuid=True),
            sa.ForeignKey("tasks.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "baseline_number",
            sa.Integer(),
            nullable=False,
            default=1,
        ),  # 1, 2, 3... for multiple baselines
        sa.Column("baseline_name", sa.String(100), nullable=True),  # "Initial Plan", "Rev 1"
        sa.Column(
            "planned_start_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column(
            "planned_end_date",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
        sa.Column("estimated_hours", sa.DECIMAL(10, 2), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("created_by", UUID(as_uuid=True), nullable=True),
        # Unique baseline number per task
        sa.UniqueConstraint(
            "task_id", "baseline_number", name="uq_task_baseline_number"
        ),
    )

    # Create indexes for common queries
    op.create_index(
        "ix_tasks_planned_dates",
        "tasks",
        ["planned_start_date", "planned_end_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_tasks_planned_dates", table_name="tasks")
    op.drop_table("task_baselines")
    op.drop_table("task_dependencies")
    op.drop_column("tasks", "planned_end_date")
    op.drop_column("tasks", "planned_start_date")
