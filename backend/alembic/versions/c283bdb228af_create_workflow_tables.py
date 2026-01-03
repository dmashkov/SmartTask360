"""create_workflow_tables

Revision ID: c283bdb228af
Revises: 2cfdb4280aa0
Create Date: 2026-01-02 21:58:23.211230

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'c283bdb228af'
down_revision = '2cfdb4280aa0'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create workflow_templates table
    op.create_table(
        'workflow_templates',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('display_name', sa.String(length=200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_system', sa.Boolean(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False),
        sa.Column('statuses', postgresql.JSONB(), nullable=False),
        sa.Column('initial_status', sa.String(length=50), nullable=False),
        sa.Column('final_statuses', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )

    # Create indexes for workflow_templates
    op.create_index('ix_workflow_templates_name', 'workflow_templates', ['name'], unique=True)

    # Create status_transitions table
    op.create_table(
        'status_transitions',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('template_id', sa.UUID(), nullable=False),
        sa.Column('from_status', sa.String(length=50), nullable=False),
        sa.Column('to_status', sa.String(length=50), nullable=False),
        sa.Column('allowed_roles', postgresql.JSONB(), nullable=False),
        sa.Column('requires_comment', sa.Boolean(), nullable=False),
        sa.Column('requires_acceptance', sa.Boolean(), nullable=False),
        sa.Column('validation_rules', postgresql.JSONB(), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['template_id'], ['workflow_templates.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes for status_transitions
    op.create_index('ix_status_transitions_template_id', 'status_transitions', ['template_id'], unique=False)
    op.create_index('ix_status_transitions_from_status', 'status_transitions', ['from_status'], unique=False)
    op.create_index('ix_status_transitions_to_status', 'status_transitions', ['to_status'], unique=False)

    # Insert seed data - System workflow templates
    op.execute("""
        INSERT INTO workflow_templates (id, name, display_name, description, is_system, is_active, statuses, initial_status, final_statuses, created_at, updated_at)
        VALUES
        -- Basic workflow
        (
            gen_random_uuid(),
            'basic',
            'Базовый workflow',
            'Простой workflow для стандартных задач',
            true,
            true,
            '{"statuses": [
                {"key": "new", "label": "Новая", "color": "#9CA3AF"},
                {"key": "in_progress", "label": "В работе", "color": "#3B82F6"},
                {"key": "review", "label": "На проверке", "color": "#F59E0B"},
                {"key": "done", "label": "Готово", "color": "#10B981"}
            ]}'::jsonb,
            'new',
            '["done"]'::jsonb,
            NOW(),
            NOW()
        ),
        -- Agile workflow
        (
            gen_random_uuid(),
            'agile',
            'Agile workflow',
            'Workflow для Agile-команд с бэклогом',
            true,
            true,
            '{"statuses": [
                {"key": "backlog", "label": "Backlog", "color": "#6B7280"},
                {"key": "todo", "label": "To Do", "color": "#9CA3AF"},
                {"key": "in_progress", "label": "In Progress", "color": "#3B82F6"},
                {"key": "review", "label": "Review", "color": "#F59E0B"},
                {"key": "testing", "label": "Testing", "color": "#8B5CF6"},
                {"key": "done", "label": "Done", "color": "#10B981"}
            ]}'::jsonb,
            'backlog',
            '["done"]'::jsonb,
            NOW(),
            NOW()
        ),
        -- Approval workflow
        (
            gen_random_uuid(),
            'approval',
            'Workflow с согласованием',
            'Workflow для задач, требующих согласования',
            true,
            true,
            '{"statuses": [
                {"key": "draft", "label": "Черновик", "color": "#9CA3AF"},
                {"key": "pending_approval", "label": "На согласовании", "color": "#F59E0B"},
                {"key": "approved", "label": "Утверждено", "color": "#3B82F6"},
                {"key": "rejected", "label": "Отклонено", "color": "#EF4444"},
                {"key": "done", "label": "Готово", "color": "#10B981"}
            ]}'::jsonb,
            'draft',
            '["done", "rejected"]'::jsonb,
            NOW(),
            NOW()
        )
    """)

    # Insert seed data - Basic workflow transitions
    op.execute("""
        INSERT INTO status_transitions (id, template_id, from_status, to_status, allowed_roles, requires_comment, requires_acceptance, validation_rules, display_order, created_at)
        SELECT
            gen_random_uuid(),
            wt.id,
            t.from_status,
            t.to_status,
            t.allowed_roles::jsonb,
            t.requires_comment,
            t.requires_acceptance,
            CASE WHEN t.validation_rules IS NULL THEN NULL ELSE t.validation_rules::jsonb END,
            t.display_order,
            NOW()
        FROM workflow_templates wt,
        (VALUES
            -- Basic workflow transitions
            ('basic', 'new', 'in_progress', '[]', false, true, null, 1),
            ('basic', 'in_progress', 'review', '[]', false, false, null, 2),
            ('basic', 'review', 'in_progress', '[]', true, false, null, 3),
            ('basic', 'review', 'done', '[]', false, false, null, 4),

            -- Agile workflow transitions
            ('agile', 'backlog', 'todo', '[]', false, false, null, 1),
            ('agile', 'todo', 'in_progress', '[]', false, true, null, 2),
            ('agile', 'in_progress', 'review', '[]', false, false, null, 3),
            ('agile', 'review', 'in_progress', '[]', true, false, null, 4),
            ('agile', 'review', 'testing', '[]', false, false, null, 5),
            ('agile', 'testing', 'review', '[]', true, false, null, 6),
            ('agile', 'testing', 'done', '[]', false, false, null, 7),
            ('agile', 'in_progress', 'backlog', '[]', false, false, null, 8),

            -- Approval workflow transitions
            ('approval', 'draft', 'pending_approval', '[]', false, false, null, 1),
            ('approval', 'pending_approval', 'approved', '["admin", "manager"]', false, false, null, 2),
            ('approval', 'pending_approval', 'rejected', '["admin", "manager"]', true, false, null, 3),
            ('approval', 'pending_approval', 'draft', '[]', true, false, null, 4),
            ('approval', 'approved', 'done', '[]', false, false, null, 5),
            ('approval', 'rejected', 'draft', '[]', false, false, null, 6)
        ) AS t(template_name, from_status, to_status, allowed_roles, requires_comment, requires_acceptance, validation_rules, display_order)
        WHERE wt.name = t.template_name
    """)


def downgrade() -> None:
    op.drop_index('ix_status_transitions_to_status', table_name='status_transitions')
    op.drop_index('ix_status_transitions_from_status', table_name='status_transitions')
    op.drop_index('ix_status_transitions_template_id', table_name='status_transitions')
    op.drop_table('status_transitions')

    op.drop_index('ix_workflow_templates_name', table_name='workflow_templates')
    op.drop_table('workflow_templates')
