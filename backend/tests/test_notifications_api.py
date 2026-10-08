"""
Test Notifications API endpoints (settings, unread tracking, mark-all-read, cleanup)
"""

import pytest


async def test_get_default_settings(client, auth_headers):
    response = await client.get("/notifications/settings/me", headers=auth_headers)
    assert response.status_code == 200
    assert "email_digest" in response.json()


async def test_update_settings(client, auth_headers):
    response = await client.patch(
        "/notifications/settings/me",
        json={
            "notify_board_task_moved": True,
            "email_digest": "instant",
            "quiet_hours_enabled": True,
            "quiet_hours_start": "22:00:00",
            "quiet_hours_end": "08:00:00",
        },
        headers=auth_headers,
    )
    assert response.status_code == 200
    settings = response.json()
    assert settings["email_digest"] == "instant"
    assert settings["quiet_hours_enabled"] is True
    assert settings["quiet_hours_start"] == "22:00:00"

    response = await client.patch(
        "/notifications/settings/me",
        json={"email_digest": "daily", "quiet_hours_enabled": False},
        headers=auth_headers,
    )
    assert response.json()["email_digest"] == "daily"
    assert response.json()["quiet_hours_enabled"] is False


async def test_unread_count_and_list_start_empty(client, auth_headers):
    unread = await client.get("/notifications/unread-count", headers=auth_headers)
    assert unread.status_code == 200
    assert unread.json()["total"] == 0

    listing = await client.get("/notifications", headers=auth_headers)
    assert listing.status_code == 200
    assert listing.json() == []


async def test_list_filters_accepted(client, auth_headers):
    for query in ("?unread_only=true", "?entity_type=task"):
        response = await client.get(f"/notifications{query}", headers=auth_headers)
        assert response.status_code == 200


async def test_mark_all_read(client, auth_headers):
    response = await client.post("/notifications/mark-all-read", json={}, headers=auth_headers)
    assert response.status_code == 200
    unread = await client.get("/notifications/unread-count", headers=auth_headers)
    assert unread.json()["total"] == 0


async def test_delete_old_notifications(client, auth_headers):
    response = await client.delete("/notifications/old/30", headers=auth_headers)
    assert response.status_code == 200


async def test_notifications_require_auth(client):
    assert (await client.get("/notifications")).status_code in (401, 403)


@pytest.mark.xfail(
    reason="TODO in tasks/service.py: no notification is created on assignment yet",
    strict=True,
)
async def test_assignee_is_notified_on_assignment(client, auth_headers, make_task):
    assignee = (
        await client.post(
            "/users/",
            json={
                "email": "notif_test_user@example.com",
                "password": "Test123!",
                "name": "Notification Test User",
                "role": "executor",
            },
            headers=auth_headers,
        )
    ).json()
    task = await make_task(title="Test Task for Notifications", priority="high")
    response = await client.patch(
        f"/tasks/{task['id']}", json={"assignee_id": assignee["id"]}, headers=auth_headers
    )
    assert response.status_code == 200

    login = await client.post(
        "/auth/login", json={"email": "notif_test_user@example.com", "password": "Test123!"}
    )
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
    unread = await client.get("/notifications/unread-count", headers=headers)
    assert unread.json()["total"] >= 1
