"""
Test Checklists API endpoints (checklists, nested items, toggle, move, stats)
"""

import pytest

MISSING_ID = "00000000-0000-0000-0000-000000000000"


@pytest.fixture
async def task(make_task):
    return await make_task(title="Launch new feature", priority="high")


@pytest.fixture
async def checklist(client, auth_headers, task):
    response = await client.post(
        "/checklists/",
        json={"task_id": task["id"], "title": "Pre-launch checks", "position": 0},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
async def make_item(client, auth_headers, checklist):
    async def _make(content: str, position: int = 0, parent_id: str | None = None) -> dict:
        payload = {"checklist_id": checklist["id"], "content": content, "position": position}
        if parent_id:
            payload["parent_id"] = parent_id
        response = await client.post("/checklists/items", json=payload, headers=auth_headers)
        assert response.status_code == 201, response.text
        return response.json()

    return _make


async def test_create_and_list_checklists(client, auth_headers, task, checklist):
    second = await client.post(
        "/checklists/",
        json={"task_id": task["id"], "title": "Post-launch tasks", "position": 1},
        headers=auth_headers,
    )
    assert second.status_code == 201

    response = await client.get(f"/checklists/tasks/{task['id']}/checklists", headers=auth_headers)
    assert response.status_code == 200
    assert [c["title"] for c in response.json()] == ["Pre-launch checks", "Post-launch tasks"]


async def test_nested_items_have_increasing_depth(make_item):
    top = await make_item("Code review")
    nested = await make_item("Check for security vulnerabilities", parent_id=top["id"])
    deep = await make_item("Run OWASP ZAP scan", parent_id=nested["id"])
    assert (top["depth"], nested["depth"], deep["depth"]) == (0, 1, 2)
    assert deep["path"] == f"{nested['path']}.{deep['id']}"


async def test_list_items_and_children(client, auth_headers, checklist, make_item):
    top = await make_item("Code review")
    nested = await make_item("Security", parent_id=top["id"])

    items = (await client.get(f"/checklists/{checklist['id']}/items", headers=auth_headers)).json()
    assert {i["id"] for i in items} == {top["id"], nested["id"]}

    children = (
        await client.get(f"/checklists/items/{top['id']}/children", headers=auth_headers)
    ).json()
    assert [c["id"] for c in children] == [nested["id"]]


async def test_items_come_back_in_tree_order_by_position(
    client, auth_headers, checklist, make_item
):
    """Regression: items used to be ordered by UUID path, i.e. randomly among siblings."""
    first = await make_item("first", position=0)
    second = await make_item("second", position=1)
    third = await make_item("third", position=2)
    child_of_first = await make_item("child of first", position=0, parent_id=first["id"])

    items = (await client.get(f"/checklists/{checklist['id']}/items", headers=auth_headers)).json()
    assert [i["id"] for i in items] == [
        first["id"],
        child_of_first["id"],
        second["id"],
        third["id"],
    ]


async def test_toggle_item(client, auth_headers, make_item):
    item = await make_item("Testing")
    response = await client.post(
        f"/checklists/items/{item['id']}/toggle",
        json={"is_completed": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_completed"] is True
    assert response.json()["completed_at"] is not None

    response = await client.post(
        f"/checklists/items/{item['id']}/toggle",
        json={"is_completed": False},
        headers=auth_headers,
    )
    assert response.json()["is_completed"] is False


async def test_with_items_and_stats(client, auth_headers, checklist, make_item):
    done, _ = await make_item("Done"), await make_item("Todo", position=1)
    await client.post(
        f"/checklists/items/{done['id']}/toggle", json={"is_completed": True}, headers=auth_headers
    )

    full = (await client.get(f"/checklists/{checklist['id']}/with-items", headers=auth_headers))
    assert full.status_code == 200
    assert len(full.json()["items"]) == 2

    stats = await client.get(f"/checklists/{checklist['id']}/stats", headers=auth_headers)
    assert stats.status_code == 200


async def test_update_item_and_checklist(client, auth_headers, checklist, make_item):
    item = await make_item("Code review")
    response = await client.patch(
        f"/checklists/items/{item['id']}",
        json={"content": "Comprehensive code review"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Comprehensive code review"

    response = await client.patch(
        f"/checklists/{checklist['id']}",
        json={"title": "Pre-launch verification"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Pre-launch verification"


async def test_move_item_to_root(client, auth_headers, make_item):
    top = await make_item("Parent")
    nested = await make_item("Child", parent_id=top["id"])
    response = await client.post(
        f"/checklists/items/{nested['id']}/move",
        json={"new_parent_id": None, "new_position": 2},
        headers=auth_headers,
    )
    assert response.status_code == 200
    moved = response.json()
    assert moved["parent_id"] is None
    assert moved["depth"] == 0
    assert moved["path"] == nested["id"]


async def test_item_with_unknown_parent_rejected(client, auth_headers, checklist):
    response = await client.post(
        "/checklists/items",
        json={
            "checklist_id": checklist["id"],
            "parent_id": MISSING_ID,
            "content": "Invalid item",
            "position": 0,
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


async def test_delete_item_and_checklist(client, auth_headers, task, checklist, make_item):
    item = await make_item("Temporary")
    assert (
        await client.delete(f"/checklists/items/{item['id']}", headers=auth_headers)
    ).status_code == 204
    items = (await client.get(f"/checklists/{checklist['id']}/items", headers=auth_headers)).json()
    assert item["id"] not in [i["id"] for i in items]

    assert (
        await client.delete(f"/checklists/{checklist['id']}", headers=auth_headers)
    ).status_code == 204
    remaining = (
        await client.get(f"/checklists/tasks/{task['id']}/checklists", headers=auth_headers)
    ).json()
    assert remaining == []
