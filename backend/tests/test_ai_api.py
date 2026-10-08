"""
Test AI API: conversations and SMART validation. The Anthropic client is replaced by FakeAI.
"""

import pytest

from app.modules.ai.client import AIError
from tests.conftest import GOOD_SMART_RESULT

MISSING_ID = "00000000-0000-0000-0000-000000000000"


@pytest.fixture
async def task(make_task):
    return await make_task(
        title="Implement user authentication system",
        description="Add JWT-based authentication with email/password login",
        priority="high",
    )


async def _validate(client, headers, task_id, **extra):
    return await client.post(
        "/ai/validate-smart", json={"task_id": task_id, "include_context": True, **extra}, headers=headers
    )


async def test_validate_smart_returns_scores_and_stores_conversation(
    client, auth_headers, task, fake_ai
):
    fake_ai.reply(GOOD_SMART_RESULT)
    response = await _validate(client, auth_headers, task["id"])
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["validation"]["overall_score"] == 0.82
    assert body["validation"]["is_valid"] is True
    assert len(body["validation"]["criteria"]) == 5

    conversation = await client.get(
        f"/ai/conversations/{body['conversation_id']}", headers=auth_headers
    )
    assert conversation.status_code == 200
    assert conversation.json()["conversation_type"] == "smart_validation"
    assert conversation.json()["task_id"] == task["id"]


async def test_validate_smart_accepts_markdown_fenced_json(client, auth_headers, task, fake_ai):
    import json

    fake_ai.reply("```json\n" + json.dumps(GOOD_SMART_RESULT) + "\n```")
    response = await _validate(client, auth_headers, task["id"])
    assert response.status_code == 200
    assert response.json()["validation"]["is_valid"] is True


async def test_validate_smart_falls_back_on_unparseable_reply(client, auth_headers, task, fake_ai):
    fake_ai.reply("this is not json at all")
    response = await _validate(client, auth_headers, task["id"])
    assert response.status_code == 200
    validation = response.json()["validation"]
    assert validation["is_valid"] is False
    assert "Could not parse" in validation["summary"]


async def test_validate_smart_ai_outage_returns_503(client, auth_headers, task, fake_ai):
    fake_ai.reply(AIError("API unavailable"))
    response = await _validate(client, auth_headers, task["id"])
    assert response.status_code == 503


async def test_validate_smart_unknown_task(client, auth_headers, fake_ai):
    response = await _validate(client, auth_headers, MISSING_ID)
    assert response.status_code == 404
    assert fake_ai.calls == []


async def test_validate_smart_requires_auth(client, task):
    response = await client.post("/ai/validate-smart", json={"task_id": task["id"]})
    assert response.status_code in (401, 403)


async def test_conversation_messages_and_listing(client, auth_headers, task, fake_ai):
    fake_ai.reply(GOOD_SMART_RESULT)
    conversation_id = (await _validate(client, auth_headers, task["id"])).json()["conversation_id"]

    messages = await client.get(
        f"/ai/conversations/{conversation_id}/messages", headers=auth_headers
    )
    assert messages.status_code == 200
    assert [m["role"] for m in messages.json()["messages"]] == ["user", "assistant"]

    listed = await client.get(f"/ai/tasks/{task['id']}/conversations", headers=auth_headers)
    assert [c["id"] for c in listed.json()] == [conversation_id]

    filtered = await client.get(
        f"/ai/tasks/{task['id']}/conversations?conversation_type=task_dialog", headers=auth_headers
    )
    assert filtered.json() == []


async def test_conversation_is_private_to_its_owner(client, auth_headers, task, fake_ai):
    fake_ai.reply(GOOD_SMART_RESULT)
    conversation_id = (await _validate(client, auth_headers, task["id"])).json()["conversation_id"]

    await client.post(
        "/users/",
        json={"email": "user2@test.com", "password": "User123!", "name": "Test User 2", "role": "executor"},
    )
    login = await client.post("/auth/login", json={"email": "user2@test.com", "password": "User123!"})
    other = {"Authorization": f"Bearer {login.json()['access_token']}"}

    response = await client.get(f"/ai/conversations/{conversation_id}", headers=other)
    assert response.status_code == 403


async def test_delete_conversation(client, auth_headers, task, fake_ai):
    fake_ai.reply(GOOD_SMART_RESULT)
    conversation_id = (await _validate(client, auth_headers, task["id"])).json()["conversation_id"]

    assert (
        await client.delete(f"/ai/conversations/{conversation_id}", headers=auth_headers)
    ).status_code == 204
    assert (
        await client.get(f"/ai/conversations/{conversation_id}", headers=auth_headers)
    ).status_code == 404


async def test_unknown_conversation_and_task_listing(client, auth_headers):
    assert (await client.get(f"/ai/conversations/{MISSING_ID}", headers=auth_headers)).status_code == 404
    response = await client.get(f"/ai/tasks/{MISSING_ID}/conversations", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []
