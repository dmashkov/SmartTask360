"""
Test Comments API endpoints
"""

import pytest


@pytest.fixture
async def task(make_task):
    return await make_task(title="Implement commenting system")


@pytest.fixture
async def make_comment(client, auth_headers, task):
    async def _make(content: str, **extra) -> dict:
        response = await client.post(
            "/comments/",
            json={"task_id": task["id"], "content": content, **extra},
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _make


async def test_create_comment(make_comment, task, admin_user):
    comment = await make_comment("This is a great idea!")
    assert comment["content"] == "This is a great idea!"
    assert comment["task_id"] == task["id"]
    assert comment["author_id"] == str(admin_user.id)


async def test_create_comment_requires_auth(client, task):
    response = await client.post("/comments/", json={"task_id": task["id"], "content": "x"})
    assert response.status_code in (401, 403)


async def test_list_task_comments(client, auth_headers, task, make_comment):
    first = await make_comment("First")
    second = await make_comment("Second")
    response = await client.get(f"/comments/tasks/{task['id']}/comments", headers=auth_headers)
    assert response.status_code == 200
    assert {first["id"], second["id"]} <= {c["id"] for c in response.json()}


async def test_reply_and_get_replies(client, auth_headers, make_comment):
    parent = await make_comment("Parent")
    reply = await make_comment("I agree!", reply_to_id=parent["id"])
    assert reply["reply_to_id"] == parent["id"]

    response = await client.get(f"/comments/{parent['id']}/replies", headers=auth_headers)
    assert response.status_code == 200
    assert [r["id"] for r in response.json()] == [reply["id"]]


async def test_reply_to_unknown_comment_rejected(client, auth_headers, task):
    response = await client.post(
        "/comments/",
        json={
            "task_id": task["id"],
            "content": "Reply to non-existent comment",
            "reply_to_id": "00000000-0000-0000-0000-000000000000",
        },
        headers=auth_headers,
    )
    assert response.status_code == 400


async def test_get_and_update_comment(client, auth_headers, make_comment):
    comment = await make_comment("Draft")
    response = await client.get(f"/comments/{comment['id']}", headers=auth_headers)
    assert response.status_code == 200

    response = await client.patch(
        f"/comments/{comment['id']}", json={"content": "Edited"}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Edited"


async def test_my_comments(client, auth_headers, make_comment):
    comment = await make_comment("Mine")
    response = await client.get("/comments/users/me/comments", headers=auth_headers)
    assert response.status_code == 200
    assert comment["id"] in [c["id"] for c in response.json()]


async def test_delete_comment(client, auth_headers, task, make_comment):
    comment = await make_comment("Temporary")
    response = await client.delete(f"/comments/{comment['id']}", headers=auth_headers)
    assert response.status_code == 204

    remaining = (
        await client.get(f"/comments/tasks/{task['id']}/comments", headers=auth_headers)
    ).json()
    assert comment["id"] not in [c["id"] for c in remaining]
