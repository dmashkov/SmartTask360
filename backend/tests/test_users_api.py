"""
Test Users API endpoints
"""

import pytest

NEW_USER = {
    "email": "manager@smarttask360.com",
    "password": "Manager123!",
    "name": "Project Manager",
    "role": "manager",
}


@pytest.fixture
async def created_user(client):
    response = await client.post("/users/", json=NEW_USER)
    assert response.status_code == 201, response.text
    return response.json()


async def test_create_user(client):
    response = await client.post("/users/", json=NEW_USER)
    assert response.status_code == 201
    user = response.json()
    assert user["email"] == NEW_USER["email"]
    assert user["name"] == NEW_USER["name"]
    assert user["role"] == "manager"
    assert "password" not in user and "password_hash" not in user


async def test_create_user_duplicate_email(client, created_user):
    response = await client.post("/users/", json=NEW_USER)
    assert response.status_code == 409


async def test_get_users(client, auth_headers, created_user):
    response = await client.get("/users/", headers=auth_headers)
    assert response.status_code == 200
    emails = {u["email"] for u in response.json()}
    assert {"admin@smarttask360.com", NEW_USER["email"]} <= emails


async def test_get_user_by_id(client, auth_headers, created_user):
    response = await client.get(f"/users/{created_user['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == NEW_USER["email"]


async def test_get_user_not_found(client, auth_headers):
    response = await client.get(
        "/users/00000000-0000-0000-0000-000000000000", headers=auth_headers
    )
    assert response.status_code == 404


async def test_get_me(client, auth_headers):
    response = await client.get("/users/me", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["email"] == "admin@smarttask360.com"


async def test_update_user(client, auth_headers, created_user):
    response = await client.patch(
        f"/users/{created_user['id']}",
        json={"name": "Senior Project Manager"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Senior Project Manager"


async def test_delete_user_is_soft(client, auth_headers, created_user):
    response = await client.delete(f"/users/{created_user['id']}", headers=auth_headers)
    assert response.status_code == 204

    response = await client.get(f"/users/{created_user['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["is_active"] is False
