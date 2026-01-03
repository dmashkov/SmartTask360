"""create_documents_table

Revision ID: 072fbed7352c
Revises: bbbd05884e22
Create Date: 2026-01-02 21:38:39.708819

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '072fbed7352c'
down_revision = 'bbbd05884e22'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create documents table
    op.create_table(
        'documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('task_id', sa.UUID(), nullable=False),
        sa.Column('uploader_id', sa.UUID(), nullable=True),
        sa.Column('filename', sa.String(length=500), nullable=False),
        sa.Column('original_filename', sa.String(length=500), nullable=False),
        sa.Column('mime_type', sa.String(length=100), nullable=False),
        sa.Column('file_size', sa.BigInteger(), nullable=False),
        sa.Column('storage_path', sa.String(length=1000), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.TIMESTAMP(), nullable=False),
        sa.Column('updated_at', sa.TIMESTAMP(), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploader_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )

    # Create indexes
    op.create_index('ix_documents_task_id', 'documents', ['task_id'], unique=False)
    op.create_index('ix_documents_uploader_id', 'documents', ['uploader_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_documents_uploader_id', table_name='documents')
    op.drop_index('ix_documents_task_id', table_name='documents')
    op.drop_table('documents')
