"""enable_ltree_extension

Revision ID: 02c59ca90213
Revises: 
Create Date: 2026-01-02 18:59:37.101830

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '02c59ca90213'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable ltree extension for hierarchical data (tasks, checklists)
    op.execute('CREATE EXTENSION IF NOT EXISTS ltree')
    # Enable pg_trgm for full-text search
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')


def downgrade() -> None:
    # Drop extensions in reverse order
    op.execute('DROP EXTENSION IF EXISTS pg_trgm')
    op.execute('DROP EXTENSION IF EXISTS ltree')
