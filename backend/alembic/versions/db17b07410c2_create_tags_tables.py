"""create_tags_tables

Revision ID: db17b07410c2
Revises: d10f89879024
Create Date: 2026-01-02 21:15:39.877973

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'db17b07410c2'
down_revision = 'd10f89879024'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tags table
    op.create_table(
        'tags',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=7), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create indexes for tags
    op.create_index('ix_tags_name', 'tags', ['name'], unique=False)

    # Create task_tags many-to-many table
    op.create_table(
        'task_tags',
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('tag_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['tag_id'], ['tags.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'tag_id')
    )

    # Create indexes for task_tags
    op.create_index('ix_task_tags_task_id', 'task_tags', ['task_id'], unique=False)
    op.create_index('ix_task_tags_tag_id', 'task_tags', ['tag_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_task_tags_tag_id', table_name='task_tags')
    op.drop_index('ix_task_tags_task_id', table_name='task_tags')
    op.drop_table('task_tags')
    op.drop_index('ix_tags_name', table_name='tags')
    op.drop_table('tags')
