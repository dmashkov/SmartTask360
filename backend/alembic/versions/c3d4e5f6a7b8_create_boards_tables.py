"""create_boards_tables

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-01-03 13:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create boards table
    op.create_table(
        'boards',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('owner_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', UUID(as_uuid=True), nullable=True),
        sa.Column('department_id', UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('workflow_template_id', UUID(as_uuid=True), sa.ForeignKey('workflow_templates.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_private', sa.Boolean(), nullable=False, default=False),
        sa.Column('is_archived', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create indexes for boards
    op.create_index('ix_boards_owner_id', 'boards', ['owner_id'])
    op.create_index('ix_boards_project_id', 'boards', ['project_id'])
    op.create_index('ix_boards_department_id', 'boards', ['department_id'])
    op.create_index('ix_boards_workflow_template_id', 'boards', ['workflow_template_id'])
    op.create_index('ix_boards_created_at', 'boards', ['created_at'])

    # Create board_columns table
    op.create_table(
        'board_columns',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('board_id', UUID(as_uuid=True), sa.ForeignKey('boards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('mapped_status', sa.String(50), nullable=True),
        sa.Column('order_index', sa.Integer(), nullable=False, default=0),
        sa.Column('color', sa.String(20), nullable=True),
        sa.Column('wip_limit', sa.Integer(), nullable=False, default=0),
        sa.Column('is_collapsed', sa.Boolean(), nullable=False, default=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('board_id', 'order_index', name='uq_board_column_order'),
    )

    # Create indexes for board_columns
    op.create_index('ix_board_columns_board_id', 'board_columns', ['board_id'])

    # Create board_tasks table
    op.create_table(
        'board_tasks',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('board_id', UUID(as_uuid=True), sa.ForeignKey('boards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id', ondelete='CASCADE'), nullable=False),
        sa.Column('column_id', UUID(as_uuid=True), sa.ForeignKey('board_columns.id', ondelete='CASCADE'), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, default=0),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('moved_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('board_id', 'task_id', name='uq_board_task'),
    )

    # Create indexes for board_tasks
    op.create_index('ix_board_tasks_board_id', 'board_tasks', ['board_id'])
    op.create_index('ix_board_tasks_task_id', 'board_tasks', ['task_id'])
    op.create_index('ix_board_tasks_column_id', 'board_tasks', ['column_id'])

    # Create board_members table
    op.create_table(
        'board_members',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('board_id', UUID(as_uuid=True), sa.ForeignKey('boards.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, default='member'),
        sa.Column('added_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.UniqueConstraint('board_id', 'user_id', name='uq_board_member'),
    )

    # Create indexes for board_members
    op.create_index('ix_board_members_board_id', 'board_members', ['board_id'])
    op.create_index('ix_board_members_user_id', 'board_members', ['user_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_board_members_user_id', table_name='board_members')
    op.drop_index('ix_board_members_board_id', table_name='board_members')
    op.drop_index('ix_board_tasks_column_id', table_name='board_tasks')
    op.drop_index('ix_board_tasks_task_id', table_name='board_tasks')
    op.drop_index('ix_board_tasks_board_id', table_name='board_tasks')
    op.drop_index('ix_board_columns_board_id', table_name='board_columns')
    op.drop_index('ix_boards_created_at', table_name='boards')
    op.drop_index('ix_boards_workflow_template_id', table_name='boards')
    op.drop_index('ix_boards_department_id', table_name='boards')
    op.drop_index('ix_boards_project_id', table_name='boards')
    op.drop_index('ix_boards_owner_id', table_name='boards')

    # Drop tables
    op.drop_table('board_members')
    op.drop_table('board_tasks')
    op.drop_table('board_columns')
    op.drop_table('boards')
