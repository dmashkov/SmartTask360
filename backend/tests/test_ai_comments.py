"""
Test AI comments, risk analysis and progress review (Anthropic client replaced by FakeAI).
"""

import pytest

MISSING_ID = "00000000-0000-0000-0000-000000000000"

RISKS = {
    "overall_risk_level": "Medium",
    "risks": [
        {
            "category": "Technical",
            "severity": "High",
            "probability": "Medium",
            "description": "WebSocket scaling",
            "mitigation": "Use a message broker",
        }
    ],
    "recommendations": ["Prototype early"],
}

REVIEW = {
    "progress_status": "on_track",
    "completion_estimate": "2 weeks",
    "summary": "One of three subtasks is done",
    "going_well": ["Architecture designed"],
    "concerns": [],
    "next_steps": ["Finish the server"],
    "risk_level": "Low",
}


@pytest.fixture
async def task(make_task):
    return await make_task(
        title="Implement real-time notifications system",
        description="Add WebSocket-based notifications",
        priority="high",
        estimated_hours=40,
    )


async def test_analyze_risks(client, auth_headers, task, fake_ai):
    fake_ai.reply(RISKS)
    response = await client.post(
        "/ai/analyze-risks",
        json={"task_id": task["id"], "include_context": True},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    analysis = response.json()["analysis"]
    assert analysis["overall_risk_level"] == "Medium"
    assert analysis["risks"][0]["description"] == "WebSocket scaling"
    assert analysis["recommendations"] == ["Prototype early"]


async def test_analyze_risks_unknown_task(client, auth_headers, fake_ai):
    response = await client.post(
        "/ai/analyze-risks", json={"task_id": MISSING_ID}, headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.parametrize("comment_type", ["insight", "risk", "blocker", "suggestion"])
async def test_generate_comment(client, auth_headers, task, fake_ai, comment_type):
    fake_ai.reply(f"A {comment_type} comment")
    response = await client.post(
        "/ai/generate-comment",
        json={"task_id": task["id"], "comment_type": comment_type},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["comment_content"] == f"A {comment_type} comment"


async def test_generate_comment_unknown_task(client, auth_headers, fake_ai):
    response = await client.post(
        "/ai/generate-comment", json={"task_id": MISSING_ID}, headers=auth_headers
    )
    assert response.status_code == 404


async def test_auto_comment_posts_a_task_comment(client, auth_headers, task, fake_ai):
    fake_ai.reply("Auto generated insight")
    response = await client.post(
        f"/ai/tasks/{task['id']}/auto-comment?comment_type=insight", headers=auth_headers
    )
    assert response.status_code == 200, response.text

    comments = (
        await client.get(f"/comments/tasks/{task['id']}/comments", headers=auth_headers)
    ).json()
    assert any("Auto generated insight" in c["content"] for c in comments)


async def test_review_progress_with_subtasks(client, auth_headers, task, make_task, fake_ai):
    await make_task(title="Design architecture", status="done", parent_id=task["id"])
    await make_task(title="Implement server", status="in_progress", parent_id=task["id"])
    await make_task(title="Client handling", status="new", parent_id=task["id"])

    fake_ai.reply(REVIEW)
    response = await client.post(
        "/ai/review-progress",
        json={"task_id": task["id"], "include_subtasks": True},
        headers=auth_headers,
    )
    assert response.status_code == 200, response.text
    assert response.json()["review"]["progress_status"] == "on_track"
    assert "Implement server" in str(fake_ai.calls[0])


async def test_review_progress_survives_unparseable_reply(client, auth_headers, task, fake_ai):
    fake_ai.reply("not json")
    response = await client.post(
        "/ai/review-progress", json={"task_id": task["id"]}, headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["review"]["progress_status"] == "unknown"
