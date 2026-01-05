"""add_task_completion_result

Revision ID: 5f7a66213635
Revises: d6e97509d03a
Create Date: 2026-01-05 20:35:20.063676

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '5f7a66213635'
down_revision = 'd6e97509d03a'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add completion_result column to tasks table
    op.add_column('tasks', sa.Column('completion_result', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove completion_result column from tasks table
    op.drop_column('tasks', 'completion_result')
