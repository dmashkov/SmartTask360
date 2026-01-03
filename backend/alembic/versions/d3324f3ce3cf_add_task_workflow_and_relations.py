"""add_task_workflow_and_relations

Revision ID: d3324f3ce3cf
Revises: c283bdb228af
Create Date: 2026-01-02 22:04:23.929053

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd3324f3ce3cf'
down_revision = 'c283bdb228af'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add workflow_template_id to tasks table
    op.add_column(
        'tasks',
        sa.Column('workflow_template_id', sa.UUID(), nullable=True)
    )

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_tasks_workflow_template_id',
        'tasks',
        'workflow_templates',
        ['workflow_template_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add index
    op.create_index(
        'ix_tasks_workflow_template_id',
        'tasks',
        ['workflow_template_id'],
        unique=False
    )

    # Create task_watchers table
    op.create_table(
        'task_watchers',
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'user_id')
    )

    # Create task_participants table
    op.create_table(
        'task_participants',
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('task_id', 'user_id')
    )


def downgrade() -> None:
    # Drop tables
    op.drop_table('task_participants')
    op.drop_table('task_watchers')

    # Drop index and constraint
    op.drop_index('ix_tasks_workflow_template_id', table_name='tasks')
    op.drop_constraint('fk_tasks_workflow_template_id', 'tasks', type_='foreignkey')

    # Drop column
    op.drop_column('tasks', 'workflow_template_id')
