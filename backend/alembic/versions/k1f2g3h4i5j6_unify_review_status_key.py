"""Unify the 'review' status key into 'in_review'

TaskStatus, board templates, Excel import and the frontend all use 'in_review', but the
system workflow templates (basic, agile) and the Gantt progress calculation used 'review'.

Revision ID: k1f2g3h4i5j6
Revises: j0e1f2g3h4i5
Create Date: 2026-10-08
"""

from alembic import op

# revision identifiers, used by Alembic.
revision = "k1f2g3h4i5j6"
down_revision = "j0e1f2g3h4i5"
branch_labels = None
depends_on = None


def _rename_status(old: str, new: str) -> None:
    # System workflow templates: status definitions (JSONB) and transitions
    op.execute(
        f"""
        UPDATE workflow_templates
        SET statuses = jsonb_set(
            statuses,
            '{{statuses}}',
            (
                SELECT jsonb_agg(
                    CASE WHEN s.elem->>'key' = '{old}'
                         THEN jsonb_set(s.elem, '{{key}}', '"{new}"')
                         ELSE s.elem END
                    ORDER BY s.ord
                )
                FROM jsonb_array_elements(statuses->'statuses') WITH ORDINALITY AS s(elem, ord)
            )
        )
        WHERE is_system AND statuses->'statuses' @> '[{{"key": "{old}"}}]'::jsonb
        """
    )
    op.execute(
        f"""
        UPDATE status_transitions
        SET from_status = CASE WHEN from_status = '{old}' THEN '{new}' ELSE from_status END,
            to_status   = CASE WHEN to_status   = '{old}' THEN '{new}' ELSE to_status   END
        WHERE template_id IN (SELECT id FROM workflow_templates WHERE is_system)
          AND ('{old}' IN (from_status, to_status))
        """
    )
    # Tasks without a workflow, or on a system workflow. Tasks on custom workflows keep
    # their own keys.
    op.execute(
        f"""
        UPDATE tasks
        SET status = '{new}'
        WHERE status = '{old}'
          AND (
            workflow_template_id IS NULL
            OR workflow_template_id IN (SELECT id FROM workflow_templates WHERE is_system)
          )
        """
    )


def upgrade() -> None:
    _rename_status("review", "in_review")


def downgrade() -> None:
    # Lossy for tasks: only tasks on system workflows can be told apart from tasks that
    # were already 'in_review' before the upgrade, so tasks without a workflow stay as is.
    _rename_status("in_review", "review")
    op.execute(
        """
        UPDATE tasks SET status = 'in_review'
        WHERE status = 'review' AND workflow_template_id IS NULL
        """
    )
