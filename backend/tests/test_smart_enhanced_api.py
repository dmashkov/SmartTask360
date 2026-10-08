"""
Test enhanced SMART validation: auto-saved scores, validation history, applying suggestions.
"""

import pytest

from tests.conftest import GOOD_SMART_RESULT


@pytest.fixture
async def task(make_task):
    return await make_task(
        title="Build microservices architecture", description="Refactor monolith into services"
    )


async def _validate(client, headers, task_id):
    response = await client.post(
        "/ai/validate-smart", json={"task_id": task_id, "include_context": True}, headers=headers
    )
    assert response.status_code == 200, response.text
    return response.json()


async def test_validation_saves_score_on_task(client, auth_headers, task, fake_ai):
    fake_ai.reply(GOOD_SMART_RESULT)
    await _validate(client, auth_headers, task["id"])

    updated = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert updated["smart_is_valid"] is True
    assert updated["smart_validated_at"] is not None
    assert updated["smart_score"]["overall_score"] == 0.82


async def test_validation_history_keeps_every_run(client, auth_headers, task, fake_ai):
    first = {**GOOD_SMART_RESULT, "overall_score": 0.4, "is_valid": False}
    fake_ai.reply(first).reply(GOOD_SMART_RESULT)
    first_id = (await _validate(client, auth_headers, task["id"]))["conversation_id"]
    second_id = (await _validate(client, auth_headers, task["id"]))["conversation_id"]

    response = await client.get(f"/ai/tasks/{task['id']}/smart-validations", headers=auth_headers)
    assert response.status_code == 200
    assert {c["id"] for c in response.json()} == {first_id, second_id}

    latest = (await client.get(f"/tasks/{task['id']}", headers=auth_headers)).json()
    assert latest["smart_score"]["overall_score"] == 0.82


async def test_apply_suggestions_for_unknown_conversation(client, auth_headers, task):
    response = await client.post(
        f"/ai/tasks/{task['id']}/apply-smart-suggestions",
        params={"conversation_id": "00000000-0000-0000-0000-000000000000"},
        headers=auth_headers,
    )
    assert response.status_code in (400, 404)
