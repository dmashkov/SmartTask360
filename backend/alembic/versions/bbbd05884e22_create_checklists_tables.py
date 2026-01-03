"""create_checklists_tables

Revision ID: bbbd05884e22
Revises: 41b5c5e08670
Create Date: 2026-01-02 21:30:11.856716

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'bbbd05884e22'
down_revision = '41b5c5e08670'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create checklists table
    op.create_table(
        'checklists',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for checklists
    op.create_index('ix_checklists_task_id', 'checklists', ['task_id'], unique=False)

    # Create checklist_items table
    op.create_table(
        'checklist_items',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('checklist_id', sa.UUID(), nullable=False),
        sa.Column('parent_id', sa.UUID(), nullable=True),
        sa.Column('path', sa.Text(), nullable=False),
        sa.Column('depth', sa.Integer(), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('is_completed', sa.Boolean(), nullable=False),
        sa.Column('position', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('completed_at', sa.TIMESTAMP(), nullable=True),
        sa.ForeignKeyConstraint(['checklist_id'], ['checklists.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['parent_id'], ['checklist_items.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for checklist_items
    op.create_index('ix_checklist_items_checklist_id', 'checklist_items', ['checklist_id'], unique=False)
    op.create_index('ix_checklist_items_parent_id', 'checklist_items', ['parent_id'], unique=False)
    op.create_index('ix_checklist_items_path', 'checklist_items', ['path'], unique=False)
    op.create_index('ix_checklist_items_depth', 'checklist_items', ['depth'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_checklist_items_depth', table_name='checklist_items')
    op.drop_index('ix_checklist_items_path', table_name='checklist_items')
    op.drop_index('ix_checklist_items_parent_id', table_name='checklist_items')
    op.drop_index('ix_checklist_items_checklist_id', table_name='checklist_items')
    op.drop_table('checklist_items')
    op.drop_index('ix_checklists_task_id', table_name='checklists')
    op.drop_table('checklists')
