"""create_ai_tables

Revision ID: a1b2c3d4e5f6
Revises: d3324f3ce3cf
Create Date: 2026-01-03 01:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB, UUID


# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = 'd3324f3ce3cf'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create ai_conversations table
    op.create_table(
        'ai_conversations',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('conversation_type', sa.String(50), nullable=False),
        sa.Column('task_id', UUID(), nullable=False),
        sa.Column('user_id', UUID(), nullable=False),
        sa.Column('model', sa.String(100), nullable=False),
        sa.Column('temperature', sa.Float(), nullable=False),
        sa.Column('status', sa.String(20), nullable=False),
        sa.Column('context', JSONB, nullable=True),
        sa.Column('result', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_ai_conversations_conversation_type', 'ai_conversations', ['conversation_type'])
    op.create_index('ix_ai_conversations_task_id', 'ai_conversations', ['task_id'])
    op.create_index('ix_ai_conversations_user_id', 'ai_conversations', ['user_id'])
    op.create_index('ix_ai_conversations_status', 'ai_conversations', ['status'])
    op.create_index('ix_ai_conversations_created_at', 'ai_conversations', ['created_at'])

    # Create ai_messages table
    op.create_table(
        'ai_messages',
        sa.Column('id', UUID(), nullable=False),
        sa.Column('conversation_id', UUID(), nullable=False),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text(), nullable=False),
        sa.Column('sequence', sa.Integer(), nullable=False),
        sa.Column('token_count', sa.Integer(), nullable=True),
        sa.Column('model_used', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['conversation_id'], ['ai_conversations.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_ai_messages_conversation_id', 'ai_messages', ['conversation_id'])
    op.create_index('ix_ai_messages_created_at', 'ai_messages', ['created_at'])


def downgrade() -> None:
    # Drop tables
    op.drop_index('ix_ai_messages_created_at', table_name='ai_messages')
    op.drop_index('ix_ai_messages_conversation_id', table_name='ai_messages')
    op.drop_table('ai_messages')

    op.drop_index('ix_ai_conversations_created_at', table_name='ai_conversations')
    op.drop_index('ix_ai_conversations_status', table_name='ai_conversations')
    op.drop_index('ix_ai_conversations_user_id', table_name='ai_conversations')
    op.drop_index('ix_ai_conversations_task_id', table_name='ai_conversations')
    op.drop_index('ix_ai_conversations_conversation_type', table_name='ai_conversations')
    op.drop_table('ai_conversations')
