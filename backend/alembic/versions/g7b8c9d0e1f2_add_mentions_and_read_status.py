"""Add mentions and read status for comments

Revision ID: g7b8c9d0e1f2
Revises: fbc88163b08f
Create Date: 2026-01-06 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'g7b8c9d0e1f2'
down_revision = '3aba546a42af'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add mentioned_user_ids to comments table
    op.add_column(
        'comments',
        sa.Column('mentioned_user_ids', postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=True)
    )

    # Create comment_read_status table for tracking read comments
    op.create_table(
        'comment_read_status',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('comment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('read_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id', 'comment_id')
    )

    # Add indexes for better query performance
    op.create_index('ix_comment_read_status_user_id', 'comment_read_status', ['user_id'])
    op.create_index('ix_comment_read_status_comment_id', 'comment_read_status', ['comment_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_comment_read_status_comment_id', 'comment_read_status')
    op.drop_index('ix_comment_read_status_user_id', 'comment_read_status')

    # Drop comment_read_status table
    op.drop_table('comment_read_status')

    # Remove mentioned_user_ids from comments
    op.drop_column('comments', 'mentioned_user_ids')
