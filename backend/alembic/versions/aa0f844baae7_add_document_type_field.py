"""add_document_type_field

Revision ID: aa0f844baae7
Revises: 5f7a66213635
Create Date: 2026-01-05 21:18:24.868273

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'aa0f844baae7'
down_revision = '5f7a66213635'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add document_type column with default value 'attachment'
    op.add_column('documents', sa.Column('document_type', sa.String(length=50), nullable=False, server_default='attachment'))
    op.create_index(op.f('ix_documents_document_type'), 'documents', ['document_type'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_documents_document_type'), table_name='documents')
    op.drop_column('documents', 'document_type')
