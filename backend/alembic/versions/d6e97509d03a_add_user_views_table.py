"""add_user_views_table

Revision ID: d6e97509d03a
Revises: a091da7fe748
Create Date: 2026-01-05 09:41:08.901509

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'd6e97509d03a'
down_revision = 'a091da7fe748'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create user_views table
    op.create_table(
        'user_views',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('filters', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('view_type', sa.String(50), nullable=False, server_default='task'),
        sa.Column('is_default', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )

    # Create index on user_id for faster lookups
    op.create_index('ix_user_views_user_id', 'user_views', ['user_id'])
    op.create_index('ix_user_views_view_type', 'user_views', ['view_type'])


def downgrade() -> None:
    op.drop_index('ix_user_views_view_type', table_name='user_views')
    op.drop_index('ix_user_views_user_id', table_name='user_views')
    op.drop_table('user_views')
