"""
Test Tasks API endpoints (CRUD, hierarchy, status, acceptance)
"""

import pytest


@pytest.fixture
async def tree(make_task):
    """root -> child -> grandchild"""
    root = await make_task(title="Implement SmartTask360 MVP", priority="high", is_milestone=True)
    child = await make_task(title="Backend API Development", parent_id=root["id"])
    grandchild = await make_task(title="Implement Tasks Module", parent_id=child["id"])
    return root, child, grandchild


async def test_create_task_defaults(make_task, admin_user):
    task = await make_task(title="Simple task", description="Do the thing")
    assert task["title"] == "Simple task"
    assert task["status"] == "new"
    assert task["depth"] == 0
    assert task["parent_id"] is None
    assert task["creator_id"] == str(admin_user.id)


async def test_create_task_requires_auth(client):
    response = await client.post("/tasks/", json={"title": "x"})
    assert response.status_code in (401, 403)


async def test_create_task_requires_title(client, auth_headers):
    response = await client.post("/tasks/", json={"priority": "high"}, headers=auth_headers)
    assert response.status_code == 422


async def test_hierarchy_depth_and_path(tree):
    root, child, grandchild = tree
    assert (root["depth"], child["depth"], grandchild["depth"]) == (0, 1, 2)
    assert child["parent_id"] == root["id"]
    assert grandchild["path"].startswith(child["path"] + ".")


async def test_get_children(client, auth_headers, tree):
    root, child, _ = tree
    response = await client.get(f"/tasks/{root['id']}/children", headers=auth_headers)
    assert response.status_code == 200
    assert [t["id"] for t in response.json()] == [child["id"]]


async def test_get_descendants(client, auth_headers, tree):
    root, child, grandchild = tree
    response = await client.get(f"/tasks/{root['id']}/descendants", headers=auth_headers)
    assert response.status_code == 200
    assert {t["id"] for t in response.json()} == {child["id"], grandchild["id"]}


async def test_get_ancestors(client, auth_headers, tree):
    root, child, grandchild = tree
    response = await client.get(f"/tasks/{grandchild['id']}/ancestors", headers=auth_headers)
    assert response.status_code == 200
    assert {t["id"] for t in response.json()} == {root["id"], child["id"]}


async def test_get_root_tasks(client, auth_headers, tree, make_task):
    other_root = await make_task(title="Another root")
    response = await client.get("/tasks/roots", headers=auth_headers)
    assert response.status_code == 200
    ids = {t["id"] for t in response.json()}
    assert tree[0]["id"] in ids and other_root["id"] in ids
    assert tree[1]["id"] not in ids


async def test_get_task_not_found(client, auth_headers):
    response = await client.get(
        "/tasks/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404


async def test_update_task(client, auth_headers, make_task):
    task = await make_task()
    response = await client.patch(
        f"/tasks/{task['id']}",
        json={"title": "Renamed", "priority": "critical"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Renamed"
    assert response.json()["priority"] == "critical"


async def test_move_task_updates_path_and_depth(client, auth_headers, tree):
    root, _, grandchild = tree
    response = await client.patch(
        f"/tasks/{grandchild['id']}", json={"parent_id": root["id"]}, headers=auth_headers
    )
    assert response.status_code == 200
    moved = response.json()
    assert moved["parent_id"] == root["id"]
    assert moved["depth"] == 1
    assert moved["path"] != grandchild["path"]


async def test_change_status_sets_started_at(client, auth_headers, make_task):
    task = await make_task()
    response = await client.post(
        f"/tasks/{task['id']}/status",
        json={"status": "in_progress", "comment": "Starting work"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["status"] == "in_progress"
    assert response.json()["started_at"] is not None


async def test_assign_and_accept_task(client, auth_headers, make_task, admin_user):
    task = await make_task()
    response = await client.patch(
        f"/tasks/{task['id']}", json={"assignee_id": str(admin_user.id)}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["assignee_id"] == str(admin_user.id)

    response = await client.post(
        f"/tasks/{task['id']}/accept",
        json={"comment": "I accept this task"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    accepted = response.json()
    assert accepted["accepted_at"] is not None
    assert accepted["status"] == "in_progress"


async def test_my_and_created_tasks(client, auth_headers, make_task, admin_user):
    assigned = await make_task(assignee_id=str(admin_user.id))
    unassigned = await make_task()

    my = (await client.get("/tasks/my", headers=auth_headers)).json()
    created = (await client.get("/tasks/created", headers=auth_headers)).json()

    assert assigned["id"] in [t["id"] for t in my]
    assert unassigned["id"] not in [t["id"] for t in my]
    assert {assigned["id"], unassigned["id"]} <= {t["id"] for t in created}


async def test_soft_delete_hides_task(client, auth_headers, tree):
    _, child, _ = tree
    response = await client.delete(f"/tasks/{child['id']}", headers=auth_headers)
    assert response.status_code == 204

    visible = (await client.get("/tasks/", headers=auth_headers)).json()
    assert child["id"] not in [t["id"] for t in visible]
