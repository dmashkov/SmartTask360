"""
Guards against status keys drifting apart between the TaskStatus enum, the system workflow
templates and the Gantt progress calculation (regression: 'review' vs 'in_review').
"""

from types import SimpleNamespace

import pytest
from sqlalchemy import select

from app.core.types import TaskStatus
from app.modules.gantt.service import GanttService
from app.modules.workflow.models import StatusTransition, WorkflowTemplate

VALID = {s.value for s in TaskStatus}
# Statuses that exist only inside the 'approval' workflow
WORKFLOW_ONLY = {"pending_approval", "approved", "rejected", "testing", "backlog", "todo", "cancelled"}


async def test_system_template_statuses_are_known(db_session):
    templates = (
        await db_session.execute(select(WorkflowTemplate).where(WorkflowTemplate.is_system))
    ).scalars().all()
    assert {t.name for t in templates} >= {"basic", "agile", "approval"}

    for template in templates:
        keys = {s["key"] for s in template.statuses["statuses"]}
        assert "review" not in keys, f"{template.name} still uses the legacy 'review' key"
        unknown = keys - VALID - WORKFLOW_ONLY
        assert not unknown, f"{template.name} has unknown statuses: {unknown}"


async def test_system_transitions_use_defined_statuses(db_session):
    templates = (
        await db_session.execute(select(WorkflowTemplate).where(WorkflowTemplate.is_system))
    ).scalars().all()
    transitions = (await db_session.execute(select(StatusTransition))).scalars().all()
    defined = {t.id: {s["key"] for s in t.statuses["statuses"]} for t in templates}

    for tr in transitions:
        if tr.template_id in defined:
            assert tr.from_status in defined[tr.template_id], tr.from_status
            assert tr.to_status in defined[tr.template_id], tr.to_status


async def test_basic_workflow_matches_board_status(client, auth_headers, make_task):
    """A task can go through 'basic' to in_review and the kanban status key is the same."""
    basic = (await client.get("/workflow/templates/by-name/basic", headers=auth_headers)).json()
    task = await make_task(workflow_template_id=basic["id"])
    for target in ("in_progress", "in_review"):
        response = await client.post(
            f"/tasks/{task['id']}/status-workflow",
            json={"new_status": target, "comment": None},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
    assert response.json()["status"] == TaskStatus.IN_REVIEW.value


@pytest.mark.parametrize(
    ("status", "expected"),
    [("new", 0), ("in_progress", 50), ("in_review", 80), ("done", 100)],
)
def test_gantt_progress_by_status(status, expected):
    task = SimpleNamespace(status=status, completed_at=None)
    assert GanttService(db=None)._calculate_progress(task) == expected
