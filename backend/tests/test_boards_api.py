"""
Test Boards API endpoints (columns, task movement, WIP limits, members, archive)
"""

import pytest


@pytest.fixture
async def board(client, auth_headers) -> dict:
    """Board from the 'basic' template: Новая → В работе → На проверке → Готово"""
    response = await client.post(
        "/boards?template=basic",
        json={"name": "Test Project Board", "description": "For tests", "is_private": False},
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    board_id = response.json()["id"]
    response = await client.get(f"/boards/{board_id}", headers=auth_headers)
    assert response.status_code == 200
    return response.json()


@pytest.fixture
async def add_to_board(client, auth_headers, board):
    async def _add(task_id: str, column_id: str):
        return await client.post(
            f"/boards/{board['id']}/tasks",
            json={"task_id": task_id, "column_id": column_id},
            headers=auth_headers,
        )

    return _add


@pytest.fixture
async def member_user(client, auth_headers) -> dict:
    response = await client.post(
        "/users/",
        json={
            "email": "board_test_user@example.com",
            "password": "Test123!",
            "name": "Board Test User",
            "role": "executor",
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_board_created_from_template(board):
    assert board["name"] == "Test Project Board"
    assert len(board["columns"]) == 4
    assert [c["mapped_status"] for c in board["columns"]] == [
        "new",
        "in_progress",
        "in_review",
        "done",
    ]


async def test_list_boards(client, auth_headers, board):
    response = await client.get("/boards", headers=auth_headers)
    assert response.status_code == 200
    assert board["id"] in [b["id"] for b in response.json()]


async def test_add_task_to_board(board, add_to_board, make_task):
    task = await make_task(title="Test Task for Board")
    response = await add_to_board(task["id"], board["columns"][0]["id"])
    assert response.status_code == 201
    assert response.json()["column_id"] == board["columns"][0]["id"]


async def test_move_task_syncs_status(client, auth_headers, board, add_to_board, make_task):
    task = await make_task(title="Moving task")
    await add_to_board(task["id"], board["columns"][0]["id"])
    in_progress, done = board["columns"][1], board["columns"][3]

    response = await client.post(
        f"/boards/{board['id']}/tasks/{task['id']}/move",
        json={"column_id": in_progress["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["status_changed"] is True
    task_now = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert task_now["status"] == "in_progress"

    response = await client.post(
        f"/boards/{board['id']}/tasks/{task['id']}/move",
        json={"column_id": done["id"]},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    task_now = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert task_now["status"] == "done"
    assert task_now["completed_at"] is not None


async def test_wip_limit_enforced(client, auth_headers, board, add_to_board, make_task):
    response = await client.post(
        f"/boards/{board['id']}/columns",
        json={"name": "Limited Column", "wip_limit": 2, "color": "#ff5733"},
        headers=auth_headers,
    )
    assert response.status_code == 201
    column_id = response.json()["id"]

    tasks = [await make_task(title=f"WIP task {i}", priority="low") for i in range(3)]
    assert (await add_to_board(tasks[0]["id"], column_id)).status_code == 201
    assert (await add_to_board(tasks[1]["id"], column_id)).status_code == 201  # at the limit
    assert (await add_to_board(tasks[2]["id"], column_id)).status_code == 400  # over the limit


async def test_reorder_columns(client, auth_headers, board):
    reversed_ids = [c["id"] for c in reversed(board["columns"])]
    response = await client.post(
        f"/boards/{board['id']}/columns/reorder",
        json={"column_ids": reversed_ids},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert [c["id"] for c in response.json()] == reversed_ids


async def test_update_and_delete_column(client, auth_headers, board):
    column_id = (
        await client.post(
            f"/boards/{board['id']}/columns", json={"name": "Extra"}, headers=auth_headers
        )
    ).json()["id"]

    response = await client.patch(
        f"/boards/{board['id']}/columns/{column_id}",
        json={"wip_limit": 5, "name": "Updated Column"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Column"
    assert response.json()["wip_limit"] == 5

    response = await client.delete(f"/boards/{board['id']}/columns/{column_id}", headers=auth_headers)
    assert response.status_code == 204


async def test_board_members(client, auth_headers, board, member_user):
    base = f"/boards/{board['id']}/members"
    uid = member_user["id"]

    response = await client.post(base, json={"user_id": uid, "role": "member"}, headers=auth_headers)
    assert response.status_code == 201

    response = await client.patch(f"{base}/{uid}", json={"role": "admin"}, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["role"] == "admin"

    assert (await client.delete(f"{base}/{uid}", headers=auth_headers)).status_code == 204


async def test_remove_task_from_board(client, auth_headers, board, add_to_board, make_task):
    task = await make_task()
    await add_to_board(task["id"], board["columns"][0]["id"])
    response = await client.delete(
        f"/boards/{board['id']}/tasks/{task['id']}", headers=auth_headers
    )
    assert response.status_code == 204


async def test_update_board(client, auth_headers, board):
    response = await client.patch(
        f"/boards/{board['id']}",
        json={"name": "Updated Test Board", "is_private": True},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Test Board"
    assert response.json()["is_private"] is True


async def test_archived_board_hidden_by_default(client, auth_headers, board):
    response = await client.patch(
        f"/boards/{board['id']}", json={"is_archived": True}, headers=auth_headers
    )
    assert response.status_code == 200

    default = (await client.get("/boards", headers=auth_headers)).json()
    with_archived = (await client.get("/boards?include_archived=true", headers=auth_headers)).json()
    assert board["id"] not in [b["id"] for b in default]
    assert board["id"] in [b["id"] for b in with_archived]


async def test_delete_board(client, auth_headers, board):
    assert (await client.delete(f"/boards/{board['id']}", headers=auth_headers)).status_code == 204
    assert (await client.get(f"/boards/{board['id']}", headers=auth_headers)).status_code == 404
