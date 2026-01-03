"""drop_column_order_constraint

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-01-03 13:05:00.000000

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Drop unique constraint on board_columns(board_id, order_index)
    # This allows reordering columns without conflicts
    op.drop_constraint('uq_board_column_order', 'board_columns', type_='unique')


def downgrade() -> None:
    # Recreate unique constraint
    op.create_unique_constraint(
        'uq_board_column_order',
        'board_columns',
        ['board_id', 'order_index']
    )
