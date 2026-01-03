"""create_comments_table

Revision ID: 41b5c5e08670
Revises: db17b07410c2
Create Date: 2026-01-02 21:21:35.705977

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '41b5c5e08670'
down_revision = 'db17b07410c2'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create comments table
    op.create_table(
        'comments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('author_id', sa.UUID(), nullable=True),
        sa.Column('author_type', sa.String(length=20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('reply_to_id', sa.UUID(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reply_to_id'], ['comments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_comments_task_id', 'comments', ['task_id'], unique=False)
    op.create_index('ix_comments_author_id', 'comments', ['author_id'], unique=False)
    op.create_index('ix_comments_created_at', 'comments', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_comments_created_at', table_name='comments')
    op.drop_index('ix_comments_author_id', table_name='comments')
    op.drop_index('ix_comments_task_id', table_name='comments')
    op.drop_table('comments')
