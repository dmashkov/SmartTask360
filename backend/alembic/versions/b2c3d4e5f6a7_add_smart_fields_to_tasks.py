"""add_smart_fields_to_tasks

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-01-03 02:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB


# revision identifiers, used by Alembic.
revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add SMART validation fields to tasks table
    op.add_column('tasks', sa.Column('smart_score', JSONB, nullable=True))
    op.add_column('tasks', sa.Column('smart_validated_at', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('smart_is_valid', sa.Boolean(), nullable=True))


def downgrade() -> None:
    # Drop SMART validation fields
    op.drop_column('tasks', 'smart_is_valid')
    op.drop_column('tasks', 'smart_validated_at')
    op.drop_column('tasks', 'smart_score')
