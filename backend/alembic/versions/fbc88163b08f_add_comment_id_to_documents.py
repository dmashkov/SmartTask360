"""add_comment_id_to_documents

Revision ID: fbc88163b08f
Revises: aa0f844baae7
Create Date: 2026-01-05 22:39:37.926418

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'fbc88163b08f'
down_revision = 'aa0f844baae7'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add comment_id column to documents table
    op.add_column('documents', sa.Column('comment_id', sa.UUID(), nullable=True))
    op.create_index(op.f('ix_documents_comment_id'), 'documents', ['comment_id'], unique=False)
    op.create_foreign_key(
        'fk_documents_comment_id_comments',
        'documents',
        'comments',
        ['comment_id'],
        ['id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    # Remove comment_id column from documents table
    op.drop_constraint('fk_documents_comment_id_comments', 'documents', type_='foreignkey')
    op.drop_index(op.f('ix_documents_comment_id'), table_name='documents')
    op.drop_column('documents', 'comment_id')
