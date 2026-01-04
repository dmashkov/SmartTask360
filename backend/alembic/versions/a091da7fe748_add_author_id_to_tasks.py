"""add_author_id_to_tasks

Revision ID: a091da7fe748
Revises: f6a7b8c9d0e1
Create Date: 2026-01-04 12:53:08.584819

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'a091da7fe748'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add author_id column, initially nullable
    op.add_column('tasks', sa.Column('author_id', sa.UUID(), nullable=True))

    # Copy creator_id to author_id for existing tasks
    op.execute("UPDATE tasks SET author_id = creator_id WHERE author_id IS NULL")

    # Make author_id not nullable
    op.alter_column('tasks', 'author_id', nullable=False)

    # Create index on author_id
    op.create_index(op.f('ix_tasks_author_id'), 'tasks', ['author_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_tasks_author_id'), table_name='tasks')
    op.drop_column('tasks', 'author_id')
