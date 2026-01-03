"""create_task_history_table

Revision ID: 2cfdb4280aa0
Revises: 072fbed7352c
Create Date: 2026-01-02 21:44:52.822530

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = '2cfdb4280aa0'
down_revision = '072fbed7352c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create task_history table
    op.create_table(
        'task_history',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('changed_by_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(length=50), nullable=False),
        sa.Column('field_name', sa.String(length=100), nullable=True),
        sa.Column('old_value', postgresql.JSONB(), nullable=True),
        sa.Column('new_value', postgresql.JSONB(), nullable=True),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('extra_data', postgresql.JSONB(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['changed_by_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_task_history_task_id', 'task_history', ['task_id'], unique=False)
    op.create_index('ix_task_history_changed_by_id', 'task_history', ['changed_by_id'], unique=False)
    op.create_index('ix_task_history_action', 'task_history', ['action'], unique=False)
    op.create_index('ix_task_history_created_at', 'task_history', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_task_history_created_at', table_name='task_history')
    op.drop_index('ix_task_history_action', table_name='task_history')
    op.drop_index('ix_task_history_changed_by_id', table_name='task_history')
    op.drop_index('ix_task_history_task_id', table_name='task_history')
    op.drop_table('task_history')
