"""
Test Tags API endpoints
"""

import pytest


@pytest.fixture
async def make_tag(client, auth_headers):
    async def _make(name: str, color: str = "#3B82F6") -> dict:
        response = await client.post(
            "/tags/", json={"name": name, "color": color}, headers=auth_headers
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _make


async def _task_tag_ids(client, headers, task_id) -> set[str]:
    response = await client.get(f"/tags/tasks/{task_id}/tags", headers=headers)
    assert response.status_code == 200
    return {t["id"] for t in response.json()}


async def test_create_and_get_tag(client, auth_headers, make_tag):
    tag = await make_tag("Backend", "#3B82F6")
    assert tag["name"] == "Backend"
    assert tag["color"] == "#3B82F6"

    response = await client.get(f"/tags/{tag['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["id"] == tag["id"]


async def test_list_tags(client, auth_headers, make_tag):
    backend, frontend = await make_tag("Backend"), await make_tag("Frontend", "#10B981")
    response = await client.get("/tags/", headers=auth_headers)
    assert response.status_code == 200
    assert {backend["id"], frontend["id"]} <= {t["id"] for t in response.json()}


async def test_update_tag_color(client, auth_headers, make_tag):
    tag = await make_tag("Backend")
    response = await client.patch(
        f"/tags/{tag['id']}", json={"color": "#8B5CF6"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["color"] == "#8B5CF6"


async def test_duplicate_tag_name_rejected(client, auth_headers, make_tag):
    await make_tag("Backend")
    response = await client.post(
        "/tags/", json={"name": "Backend", "color": "#000000"}, headers=auth_headers
    )
    assert response.status_code == 400


async def test_assign_tags_replaces_set(client, auth_headers, make_tag, make_task):
    backend, bug = await make_tag("Backend"), await make_tag("Bug", "#EF4444")
    task = await make_task(title="Fix authentication bug")

    response = await client.post(
        f"/tags/tasks/{task['id']}/tags",
        json={"tag_ids": [backend["id"], bug["id"]]},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert {t["id"] for t in response.json()} == {backend["id"], bug["id"]}

    response = await client.post(
        f"/tags/tasks/{task['id']}/tags", json={"tag_ids": [bug["id"]]}, headers=auth_headers
    )
    assert response.status_code == 200
    assert await _task_tag_ids(client, auth_headers, task["id"]) == {bug["id"]}


async def test_add_and_remove_single_tag(client, auth_headers, make_tag, make_task):
    frontend, bug = await make_tag("Frontend", "#10B981"), await make_tag("Bug", "#EF4444")
    task = await make_task()
    await client.post(
        f"/tags/tasks/{task['id']}/tags", json={"tag_ids": [bug["id"]]}, headers=auth_headers
    )

    response = await client.put(
        f"/tags/tasks/{task['id']}/tags/{frontend['id']}", headers=auth_headers
    )
    assert response.status_code == 204
    assert await _task_tag_ids(client, auth_headers, task["id"]) == {frontend["id"], bug["id"]}

    response = await client.delete(
        f"/tags/tasks/{task['id']}/tags/{bug['id']}", headers=auth_headers
    )
    assert response.status_code == 204
    assert await _task_tag_ids(client, auth_headers, task["id"]) == {frontend["id"]}


async def test_delete_tag_is_soft(client, auth_headers, make_tag):
    keep, drop = await make_tag("Keep"), await make_tag("Drop", "#EF4444")
    response = await client.delete(f"/tags/{drop['id']}", headers=auth_headers)
    assert response.status_code == 204

    active = (await client.get("/tags/?active_only=true", headers=auth_headers)).json()
    ids = {t["id"] for t in active}
    assert keep["id"] in ids
    assert drop["id"] not in ids
