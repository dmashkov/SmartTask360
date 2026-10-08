"""
Test Tasks Extended API (workflow transitions, watchers, participants)
"""

import pytest


@pytest.fixture
async def basic_workflow(client, auth_headers):
    response = await client.get("/workflow/templates/by-name/basic", headers=auth_headers)
    assert response.status_code == 200, response.text
    return response.json()


@pytest.fixture
async def workflow_task(make_task, basic_workflow):
    return await make_task(
        title="Implement user authentication",
        priority="high",
        workflow_template_id=basic_workflow["id"],
    )


async def _change(client, headers, task_id, new_status):
    return await client.post(
        f"/tasks/{task_id}/status-workflow",
        json={"new_status": new_status, "comment": None},
        headers=headers,
    )


async def test_available_transitions_with_workflow(client, auth_headers, workflow_task):
    response = await client.get(
        f"/tasks/{workflow_task['id']}/available-transitions", headers=auth_headers
    )
    assert response.status_code == 200


async def test_valid_workflow_transitions(client, auth_headers, workflow_task):
    for target in ("in_progress", "in_review"):
        response = await _change(client, auth_headers, workflow_task["id"], target)
        assert response.status_code == 200, response.text
        assert response.json()["status"] == target


async def test_invalid_workflow_transition_rejected(client, auth_headers, workflow_task):
    await _change(client, auth_headers, workflow_task["id"], "in_progress")
    response = await _change(client, auth_headers, workflow_task["id"], "done")
    assert response.status_code == 400


async def test_task_without_workflow_allows_any_transition(client, auth_headers, make_task):
    task = await make_task(title="Fix bug in login", priority="critical")
    response = await _change(client, auth_headers, task["id"], "done")
    assert response.status_code == 200
    assert response.json()["status"] == "done"


async def test_watchers_lifecycle(client, auth_headers, make_task, admin_user):
    task = await make_task()
    uid = str(admin_user.id)
    base = f"/tasks/{task['id']}/watchers"

    assert (await client.post(base, json={"user_id": uid}, headers=auth_headers)).status_code == 204
    watchers = (await client.get(base, headers=auth_headers)).json()
    assert [w["id"] for w in watchers] == [uid]

    watched = (await client.get("/tasks/me/watched", headers=auth_headers)).json()
    assert task["id"] in [t["id"] for t in watched]

    assert (await client.delete(f"{base}/{uid}", headers=auth_headers)).status_code == 204
    assert (await client.get(base, headers=auth_headers)).json() == []


async def test_add_watcher_is_idempotent(client, auth_headers, make_task, admin_user):
    task = await make_task()
    base = f"/tasks/{task['id']}/watchers"
    for _ in range(2):
        response = await client.post(
            base, json={"user_id": str(admin_user.id)}, headers=auth_headers
        )
        assert response.status_code == 204
    assert len((await client.get(base, headers=auth_headers)).json()) == 1


async def test_participants_lifecycle(client, auth_headers, make_task, admin_user):
    task = await make_task()
    uid = str(admin_user.id)
    base = f"/tasks/{task['id']}/participants"

    assert (await client.post(base, json={"user_id": uid}, headers=auth_headers)).status_code == 204
    participants = (await client.get(base, headers=auth_headers)).json()
    assert [p["id"] for p in participants] == [uid]

    participated = (await client.get("/tasks/me/participated", headers=auth_headers)).json()
    assert task["id"] in [t["id"] for t in participated]

    assert (await client.delete(f"{base}/{uid}", headers=auth_headers)).status_code == 204
    assert (await client.get(base, headers=auth_headers)).json() == []
