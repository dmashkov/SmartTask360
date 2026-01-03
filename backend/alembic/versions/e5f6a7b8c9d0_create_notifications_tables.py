"""create_notifications_tables

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-01-03 13:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create notifications table
    op.create_table(
        'notifications',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('type', sa.String(50), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('content', sa.Text(), nullable=True),
        sa.Column('entity_type', sa.String(50), nullable=True),
        sa.Column('entity_id', UUID(as_uuid=True), nullable=True),
        sa.Column('actor_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('is_read', sa.Boolean(), nullable=False, default=False),
        sa.Column('priority', sa.String(20), nullable=False, default='normal'),
        sa.Column('group_key', sa.String(200), nullable=True),
        sa.Column('extra_data', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('read_at', sa.DateTime(), nullable=True),
    )

    # Create indexes for notifications
    op.create_index('ix_notifications_user_id', 'notifications', ['user_id'])
    op.create_index('ix_notifications_type', 'notifications', ['type'])
    op.create_index('ix_notifications_entity_id', 'notifications', ['entity_id'])
    op.create_index('ix_notifications_actor_id', 'notifications', ['actor_id'])
    op.create_index('ix_notifications_is_read', 'notifications', ['is_read'])
    op.create_index('ix_notifications_group_key', 'notifications', ['group_key'])
    op.create_index('ix_notifications_created_at', 'notifications', ['created_at'])

    # Composite index for common query: unread notifications for user
    op.create_index(
        'ix_notifications_user_unread',
        'notifications',
        ['user_id', 'is_read'],
        postgresql_where=sa.text('is_read = false')
    )

    # Create notification_settings table
    op.create_table(
        'notification_settings',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, unique=True),

        # Task notifications
        sa.Column('notify_task_assigned', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_comment', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_mention', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_status_changed', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_due_soon', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_overdue', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_accepted', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_task_rejected', sa.Boolean(), nullable=False, default=True),

        # Checklist notifications
        sa.Column('notify_checklist_assigned', sa.Boolean(), nullable=False, default=True),
        sa.Column('notify_checklist_completed', sa.Boolean(), nullable=False, default=True),

        # AI notifications
        sa.Column('notify_ai_validation_complete', sa.Boolean(), nullable=False, default=True),

        # Board notifications
        sa.Column('notify_board_task_moved', sa.Boolean(), nullable=False, default=False),

        # Email settings
        sa.Column('email_enabled', sa.Boolean(), nullable=False, default=True),
        sa.Column('email_digest', sa.String(20), nullable=False, default='daily'),

        # Quiet hours
        sa.Column('quiet_hours_enabled', sa.Boolean(), nullable=False, default=False),
        sa.Column('quiet_hours_start', sa.Time(), nullable=True),
        sa.Column('quiet_hours_end', sa.Time(), nullable=True),

        # Push notifications
        sa.Column('push_enabled', sa.Boolean(), nullable=False, default=True),

        # Timestamps
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
    )

    # Create index for notification_settings
    op.create_index('ix_notification_settings_user_id', 'notification_settings', ['user_id'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('ix_notification_settings_user_id', table_name='notification_settings')
    op.drop_index('ix_notifications_user_unread', table_name='notifications')
    op.drop_index('ix_notifications_created_at', table_name='notifications')
    op.drop_index('ix_notifications_group_key', table_name='notifications')
    op.drop_index('ix_notifications_is_read', table_name='notifications')
    op.drop_index('ix_notifications_actor_id', table_name='notifications')
    op.drop_index('ix_notifications_entity_id', table_name='notifications')
    op.drop_index('ix_notifications_type', table_name='notifications')
    op.drop_index('ix_notifications_user_id', table_name='notifications')

    # Drop tables
    op.drop_table('notification_settings')
    op.drop_table('notifications')
