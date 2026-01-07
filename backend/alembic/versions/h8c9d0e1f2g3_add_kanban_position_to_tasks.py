"""Add kanban_position field to tasks

Revision ID: h8c9d0e1f2g3
Revises: g7b8c9d0e1f2
Create Date: 2026-01-07

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "h8c9d0e1f2g3"
down_revision = "g7b8c9d0e1f2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add kanban_position column with default value 0
    op.add_column(
        "tasks",
        sa.Column("kanban_position", sa.Integer(), nullable=False, server_default="0"),
    )
    # Create index for efficient ordering
    op.create_index("ix_tasks_kanban_position", "tasks", ["kanban_position"])


def downgrade() -> None:
    op.drop_index("ix_tasks_kanban_position", "tasks")
    op.drop_column("tasks", "kanban_position")
