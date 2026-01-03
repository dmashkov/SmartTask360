"""create_tasks_table

Revision ID: d10f89879024
Revises: 288f745ed472
Create Date: 2026-01-02 21:00:18.327787

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision = 'd10f89879024'
down_revision = '288f745ed472'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tasks table with ltree path column
    op.execute(text("""
        CREATE TABLE tasks (
            id UUID PRIMARY KEY,
            title VARCHAR(500) NOT NULL,
            description TEXT,
            status VARCHAR(50) NOT NULL DEFAULT 'new',
            priority VARCHAR(20) NOT NULL DEFAULT 'medium',
            creator_id UUID NOT NULL,
            assignee_id UUID,
            parent_id UUID,
            path LTREE NOT NULL,
            depth INTEGER NOT NULL DEFAULT 0,
            department_id UUID,
            project_id UUID,
            source_document_id UUID,
            source_quote TEXT,
            due_date TIMESTAMP,
            started_at TIMESTAMP,
            completed_at TIMESTAMP,
            is_milestone BOOLEAN NOT NULL DEFAULT FALSE,
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            estimated_hours DECIMAL(10, 2),
            actual_hours DECIMAL(10, 2),
            accepted_at TIMESTAMP,
            acceptance_deadline TIMESTAMP,
            rejection_reason VARCHAR(50),
            rejection_comment TEXT,
            created_at TIMESTAMP NOT NULL,
            updated_at TIMESTAMP NOT NULL
        )
    """))

    # Create indexes
    op.create_index('ix_tasks_status', 'tasks', ['status'], unique=False)
    op.create_index('ix_tasks_creator_id', 'tasks', ['creator_id'], unique=False)
    op.create_index('ix_tasks_assignee_id', 'tasks', ['assignee_id'], unique=False)
    op.create_index('ix_tasks_parent_id', 'tasks', ['parent_id'], unique=False)
    op.create_index('ix_tasks_path', 'tasks', ['path'], unique=False, postgresql_using='gist')
    op.create_index('ix_tasks_department_id', 'tasks', ['department_id'], unique=False)
    op.create_index('ix_tasks_project_id', 'tasks', ['project_id'], unique=False)
    op.create_index('ix_tasks_due_date', 'tasks', ['due_date'], unique=False)
    op.create_index('ix_tasks_is_deleted', 'tasks', ['is_deleted'], unique=False)
    op.create_index('ix_tasks_created_at', 'tasks', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_tasks_created_at', table_name='tasks')
    op.drop_index('ix_tasks_is_deleted', table_name='tasks')
    op.drop_index('ix_tasks_due_date', table_name='tasks')
    op.drop_index('ix_tasks_project_id', table_name='tasks')
    op.drop_index('ix_tasks_department_id', table_name='tasks')
    op.drop_index('ix_tasks_path', table_name='tasks')
    op.drop_index('ix_tasks_parent_id', table_name='tasks')
    op.drop_index('ix_tasks_assignee_id', table_name='tasks')
    op.drop_index('ix_tasks_creator_id', table_name='tasks')
    op.drop_index('ix_tasks_status', table_name='tasks')
    op.drop_table('tasks')
