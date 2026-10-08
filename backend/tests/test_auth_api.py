"""
Test Auth API endpoints
"""

from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD


async def test_login(client):
    response = await client.post(
        "/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 200
    tokens = response.json()
    assert tokens["token_type"] == "bearer"
    assert tokens["access_token"]
    assert tokens["refresh_token"]


async def test_login_invalid_password(client):
    response = await client.post(
        "/auth/login", json={"email": ADMIN_EMAIL, "password": "WrongPassword"}
    )
    assert response.status_code == 401


async def test_login_unknown_user(client):
    response = await client.post(
        "/auth/login", json={"email": "nobody@example.com", "password": ADMIN_PASSWORD}
    )
    assert response.status_code == 401


async def test_refresh_token(client, admin_tokens):
    response = await client.post(
        "/auth/refresh", json={"refresh_token": admin_tokens["refresh_token"]}
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_refresh_with_access_token_rejected(client, admin_tokens):
    response = await client.post(
        "/auth/refresh", json={"refresh_token": admin_tokens["access_token"]}
    )
    assert response.status_code == 401


async def test_protected_endpoint(client, auth_headers):
    response = await client.get("/users/", headers=auth_headers)
    assert response.status_code == 200
    assert any(u["email"] == ADMIN_EMAIL for u in response.json())


async def test_protected_endpoint_without_token(client):
    response = await client.get("/users/")
    assert response.status_code in (401, 403)


async def test_invalid_token(client):
    response = await client.get("/users/", headers={"Authorization": "Bearer invalid_token_here"})
    assert response.status_code == 401
