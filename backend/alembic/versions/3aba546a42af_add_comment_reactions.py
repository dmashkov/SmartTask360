"""add_comment_reactions

Revision ID: 3aba546a42af
Revises: fbc88163b08f
Create Date: 2026-01-06 17:47:35.142913

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '3aba546a42af'
down_revision = 'fbc88163b08f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create comment_reactions table
    op.create_table(
        'comment_reactions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('comment_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('emoji', sa.String(length=10), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['comment_id'], ['comments.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('comment_id', 'user_id', 'emoji', name='unique_comment_user_emoji')
    )
    op.create_index(op.f('ix_comment_reactions_comment_id'), 'comment_reactions', ['comment_id'], unique=False)
    op.create_index(op.f('ix_comment_reactions_created_at'), 'comment_reactions', ['created_at'], unique=False)
    op.create_index(op.f('ix_comment_reactions_user_id'), 'comment_reactions', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_comment_reactions_user_id'), table_name='comment_reactions')
    op.drop_index(op.f('ix_comment_reactions_created_at'), table_name='comment_reactions')
    op.drop_index(op.f('ix_comment_reactions_comment_id'), table_name='comment_reactions')
    op.drop_table('comment_reactions')
