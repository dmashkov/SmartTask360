"""
Test AI task dialogs (clarify / decompose / technical / testing): start, chat, complete.
"""

import pytest

MISSING_ID = "00000000-0000-0000-0000-000000000000"
SUMMARY = {
    "key_points": ["Use JWT", "15 minute expiry"],
    "recommendations": ["Add refresh tokens"],
    "suggested_title": "Implement JWT authentication",
    "suggested_description": "Email/password login with JWT and refresh tokens",
}


@pytest.fixture
async def task(make_task):
    return await make_task(
        title="Implement user authentication system",
        description="Add authentication to the application",
        priority="high",
    )


async def _start(client, headers, task_id, dialog_type="clarify", **extra):
    return await client.post(
        f"/ai/tasks/{task_id}/start-dialog",
        json={"task_id": task_id, "dialog_type": dialog_type, **extra},
        headers=headers,
    )


@pytest.mark.parametrize("dialog_type", ["clarify", "decompose", "technical", "testing"])
async def test_start_dialog_for_each_type(client, auth_headers, task, fake_ai, dialog_type):
    fake_ai.reply(f"Hello! Let's {dialog_type} this task.")
    response = await _start(client, auth_headers, task["id"], dialog_type)
    assert response.status_code == 200, response.text
    assert response.json()["ai_greeting"] == f"Hello! Let's {dialog_type} this task."
    assert response.json()["conversation_id"]


async def test_start_dialog_sends_task_context_to_ai(client, auth_headers, task, fake_ai):
    await _start(client, auth_headers, task["id"])
    sent = str(fake_ai.calls[0])
    assert "Implement user authentication system" in sent


async def test_start_dialog_unknown_task(client, auth_headers, fake_ai):
    response = await _start(client, auth_headers, MISSING_ID)
    assert response.status_code == 404


async def test_chat_messages_are_stored_in_order(client, auth_headers, task, fake_ai):
    fake_ai.reply("Greeting").reply("First answer").reply("Second answer")
    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]

    for text, expected in (("Need JWT", "First answer"), ("15 minute expiry", "Second answer")):
        response = await client.post(
            f"/ai/conversations/{conversation_id}/messages",
            json={"content": text},
            headers=auth_headers,
        )
        assert response.status_code == 200, response.text
        assert response.json()["ai_message"]["content"] == expected

    history = await client.get(
        f"/ai/conversations/{conversation_id}/messages", headers=auth_headers
    )
    contents = [m["content"] for m in history.json()["messages"]]
    assert contents[-4:] == ["Need JWT", "First answer", "15 minute expiry", "Second answer"]


async def test_chat_history_is_sent_to_ai(client, auth_headers, task, fake_ai):
    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]
    await client.post(
        f"/ai/conversations/{conversation_id}/messages",
        json={"content": "Remember the number 42"},
        headers=auth_headers,
    )
    await client.post(
        f"/ai/conversations/{conversation_id}/messages",
        json={"content": "What number?"},
        headers=auth_headers,
    )
    assert "Remember the number 42" in str(fake_ai.calls[-1]["messages"])


async def test_chat_ai_failure_marks_conversation_failed(client, auth_headers, task, fake_ai):
    from app.modules.ai.client import AIError

    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]
    fake_ai.reply(AIError("boom"))
    response = await client.post(
        f"/ai/conversations/{conversation_id}/messages",
        json={"content": "Hello?"},
        headers=auth_headers,
    )
    assert response.status_code >= 500 or response.status_code == 503
    conversation = await client.get(f"/ai/conversations/{conversation_id}", headers=auth_headers)
    assert conversation.json()["status"] == "failed"


async def test_complete_dialog_without_applying(client, auth_headers, task, fake_ai):
    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]
    fake_ai.reply(SUMMARY)
    response = await client.post(
        f"/ai/conversations/{conversation_id}/complete-dialog",
        json={"apply_changes": False},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["success"] is True
    assert response.json()["task"] is None

    unchanged = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert unchanged["title"] == task["title"]


async def test_complete_dialog_applies_suggested_changes(client, auth_headers, task, fake_ai):
    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]
    fake_ai.reply(SUMMARY)
    response = await client.post(
        f"/ai/conversations/{conversation_id}/complete-dialog",
        json={"apply_changes": True},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["changes_summary"]

    updated = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert updated["title"] == "Implement JWT authentication"
    assert updated["description"] == SUMMARY["suggested_description"]


async def test_complete_dialog_twice_rejected(client, auth_headers, task, fake_ai):
    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]
    fake_ai.reply(SUMMARY)
    url = f"/ai/conversations/{conversation_id}/complete-dialog"
    first = await client.post(url, json={"apply_changes": False}, headers=auth_headers)
    second = await client.post(url, json={"apply_changes": False}, headers=auth_headers)
    assert first.status_code == 200
    assert second.status_code == 400


async def test_complete_non_dialog_conversation_rejected(client, auth_headers, task, fake_ai):
    from tests.conftest import GOOD_SMART_RESULT

    fake_ai.reply(GOOD_SMART_RESULT)
    validation = await client.post(
        "/ai/validate-smart", json={"task_id": task["id"]}, headers=auth_headers
    )
    response = await client.post(
        f"/ai/conversations/{validation.json()['conversation_id']}/complete-dialog",
        json={"apply_changes": False},
        headers=auth_headers,
    )
    assert response.status_code == 400


async def test_list_dialogs_by_type(client, auth_headers, task, fake_ai):
    conversation_id = (await _start(client, auth_headers, task["id"])).json()["conversation_id"]
    response = await client.get(
        f"/ai/tasks/{task['id']}/conversations?conversation_type=task_dialog", headers=auth_headers
    )
    assert [c["id"] for c in response.json()] == [conversation_id]
