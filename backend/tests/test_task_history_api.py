"""
Test Task History API endpoints
"""

import pytest


@pytest.fixture
async def task(make_task):
    return await make_task(title="Implement audit logging", priority="high")


@pytest.fixture
async def add_entry(client, auth_headers):
    async def _add(task_id: str, action: str, **extra) -> dict:
        response = await client.post(
            "/task-history/",
            json={"task_id": task_id, "action": action, **extra},
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _add


async def _history(client, headers, task_id, query: str = "") -> list[dict]:
    response = await client.get(f"/task-history/tasks/{task_id}/history{query}", headers=headers)
    assert response.status_code == 200
    return response.json()


async def test_create_entry(add_entry, task, admin_user):
    entry = await add_entry(
        task["id"],
        "status_changed",
        field_name="status",
        old_value={"value": "new"},
        new_value={"value": "in_progress"},
        comment="Status changed",
    )
    assert entry["action"] == "status_changed"
    assert entry["old_value"] == {"value": "new"}
    assert entry["new_value"] == {"value": "in_progress"}
    assert entry["changed_by_id"] == str(admin_user.id)


async def test_create_entry_with_extra_data(add_entry, task):
    entry = await add_entry(
        task["id"], "exported", extra_data={"format": "pdf", "pages": 5}
    )
    assert entry["extra_data"] == {"format": "pdf", "pages": 5}


async def test_history_filters(client, auth_headers, task, add_entry):
    await add_entry(task["id"], "status_changed", field_name="status")
    await add_entry(task["id"], "assigned", field_name="assignee_id")
    await add_entry(task["id"], "updated", field_name="priority")

    by_action = await _history(client, auth_headers, task["id"], "?action=status_changed")
    assert {e["action"] for e in by_action} == {"status_changed"}

    by_field = await _history(client, auth_headers, task["id"], "?field_name=priority")
    assert {e["field_name"] for e in by_field} == {"priority"}


async def test_summary(client, auth_headers, task, add_entry):
    await add_entry(task["id"], "created")
    await add_entry(task["id"], "updated", field_name="priority")
    await add_entry(task["id"], "updated", field_name="title")

    response = await client.get(f"/task-history/tasks/{task['id']}/summary", headers=auth_headers)
    assert response.status_code == 200
    summary = response.json()
    assert summary["actions"]["updated"] == 2
    assert summary["actions"]["created"] >= 1
    assert summary["unique_users"] == 1


async def test_my_activity_and_recent(client, auth_headers, task, add_entry):
    entry = await add_entry(task["id"], "created", comment="Created")

    mine = await client.get("/task-history/users/me/activity", headers=auth_headers)
    assert mine.status_code == 200
    assert entry["id"] in [e["id"] for e in mine.json()]

    recent = await client.get("/task-history/recent?limit=10", headers=auth_headers)
    assert recent.status_code == 200
    assert entry["id"] in [e["id"] for e in recent.json()]


async def test_delete_task_history(client, auth_headers, make_task, add_entry):
    other = await make_task(title="Review code changes")
    await add_entry(other["id"], "created")

    response = await client.delete(f"/task-history/tasks/{other['id']}/history", headers=auth_headers)
    assert response.status_code == 204
    assert await _history(client, auth_headers, other["id"]) == []
