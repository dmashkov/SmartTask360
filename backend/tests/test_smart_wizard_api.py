"""
Test the SMART Wizard flow: analyze -> refine -> apply (Anthropic client replaced by FakeAI).
"""

import json

import pytest

MISSING_ID = "00000000-0000-0000-0000-000000000000"

ANALYSIS = {
    "initial_assessment": "The task lacks measurable criteria",
    "can_skip": False,
    "questions": [
        {
            "id": "q1",
            "type": "radio",
            "question": "Which auth method?",
            "options": [
                {"value": "jwt", "label": "JWT"},
                {"value": "session", "label": "Session"},
            ],
            "required": True,
        },
        {"id": "q2", "type": "text", "question": "Deadline?", "required": False},
    ],
}

PROPOSAL = {
    "title": "Implement JWT authentication with 15-minute tokens",
    "description": "Email/password login issuing JWT access and refresh tokens.\nCovered by tests.",
    "definition_of_done": ["Login endpoint returns tokens", "Refresh flow works", "Tests pass"],
    "time_estimate": {
        "total_hours": 16,
        "total_days": 2,
        "breakdown": [{"task": "Endpoints", "hours": 8}, {"task": "Tests", "hours": 8}],
        "confidence": "medium",
    },
}


@pytest.fixture
async def task(make_task):
    return await make_task(title="Add authentication", description="Make it secure")


async def _analyze(client, headers, task_id):
    return await client.post(
        "/ai/smart/analyze", json={"task_id": task_id, "include_context": True}, headers=headers
    )


async def _refine(client, headers, conversation_id):
    return await client.post(
        "/ai/smart/refine",
        json={
            "conversation_id": conversation_id,
            "answers": [{"question_id": "q1", "value": "jwt"}],
            "additional_context": "Mobile clients too",
        },
        headers=headers,
    )


async def test_analyze_returns_questions(client, auth_headers, task, fake_ai):
    fake_ai.reply(ANALYSIS)
    response = await _analyze(client, auth_headers, task["id"])
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["initial_assessment"] == ANALYSIS["initial_assessment"]
    assert [q["id"] for q in body["questions"]] == ["q1", "q2"]
    assert body["can_skip"] is False


async def test_analyze_accepts_fenced_json(client, auth_headers, task, fake_ai):
    fake_ai.reply("```json\n" + json.dumps(ANALYSIS) + "\n```")
    response = await _analyze(client, auth_headers, task["id"])
    assert response.status_code == 200
    assert len(response.json()["questions"]) == 2


async def test_analyze_survives_unparseable_reply(client, auth_headers, task, fake_ai):
    fake_ai.reply("sorry, no json today")
    response = await _analyze(client, auth_headers, task["id"])
    assert response.status_code == 200
    assert response.json()["questions"] == []


async def test_analyze_unknown_task(client, auth_headers, fake_ai):
    assert (await _analyze(client, auth_headers, MISSING_ID)).status_code == 404


async def test_refine_returns_proposal_and_original(client, auth_headers, task, fake_ai):
    fake_ai.reply(ANALYSIS)
    conversation_id = (await _analyze(client, auth_headers, task["id"])).json()["conversation_id"]

    fake_ai.reply(PROPOSAL)
    response = await _refine(client, auth_headers, conversation_id)
    assert response.status_code == 200, response.text
    proposal = response.json()["proposal"]
    assert proposal["title"] == PROPOSAL["title"]
    assert proposal["definition_of_done"] == PROPOSAL["definition_of_done"]
    assert proposal["time_estimate"]["total_hours"] == 16
    assert response.json()["original_task"]["title"] == "Add authentication"


async def test_refine_repairs_raw_newlines_in_strings(client, auth_headers, task, fake_ai):
    """Regression: models sometimes put literal newlines inside JSON string values."""
    fake_ai.reply(ANALYSIS)
    conversation_id = (await _analyze(client, auth_headers, task["id"])).json()["conversation_id"]

    broken = (
        '{"title": "Auth", "description": "Line one\nLine two", '
        '"definition_of_done": ["Done"]}'
    )
    fake_ai.reply(broken)
    response = await _refine(client, auth_headers, conversation_id)
    assert response.status_code == 200, response.text
    assert response.json()["proposal"]["description"] == "Line one\nLine two"


async def test_refine_with_garbage_reply_is_an_error(client, auth_headers, task, fake_ai):
    fake_ai.reply(ANALYSIS)
    conversation_id = (await _analyze(client, auth_headers, task["id"])).json()["conversation_id"]

    fake_ai.reply("definitely not json")
    response = await _refine(client, auth_headers, conversation_id)
    assert response.status_code in (400, 503)


async def test_refine_unknown_conversation(client, auth_headers, fake_ai):
    response = await _refine(client, auth_headers, MISSING_ID)
    assert response.status_code == 404


async def test_apply_updates_task_and_creates_dod_checklist(client, auth_headers, task, fake_ai):
    fake_ai.reply(ANALYSIS)
    conversation_id = (await _analyze(client, auth_headers, task["id"])).json()["conversation_id"]
    fake_ai.reply(PROPOSAL)
    await _refine(client, auth_headers, conversation_id)

    response = await client.post(
        "/ai/smart/apply", json={"conversation_id": conversation_id}, headers=auth_headers
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["success"] is True
    assert body["checklist_id"]

    updated = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert updated["title"] == PROPOSAL["title"]
    assert updated["description"] == PROPOSAL["description"]

    items = (await client.get(f"/checklists/{body['checklist_id']}/items", headers=auth_headers)).json()
    assert [i["content"] for i in items] == PROPOSAL["definition_of_done"]


async def test_apply_respects_flags_and_custom_values(client, auth_headers, task, fake_ai):
    fake_ai.reply(ANALYSIS)
    conversation_id = (await _analyze(client, auth_headers, task["id"])).json()["conversation_id"]
    fake_ai.reply(PROPOSAL)
    await _refine(client, auth_headers, conversation_id)

    response = await client.post(
        "/ai/smart/apply",
        json={
            "conversation_id": conversation_id,
            "apply_title": True,
            "apply_description": False,
            "apply_dod": False,
            "custom_title": "My own title",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["checklist_id"] is None

    updated = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert updated["title"] == "My own title"
    assert updated["description"] == "Make it secure"
