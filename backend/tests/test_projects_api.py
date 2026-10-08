"""
SmartTask360 — Projects API tests
"""

from uuid import uuid4

import pytest


def _project_payload(**overrides) -> dict:
    payload = {
        "name": f"Test Project {uuid4().hex[:8]}",
        "code": f"TST{uuid4().hex[:5].upper()}",
        "description": "Test project",
        "status": "planning",
    }
    payload.update(overrides)
    return payload


@pytest.fixture
async def created_project(client, auth_headers):
    response = await client.post("/projects", json=_project_payload(), headers=auth_headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
async def other_user(client):
    response = await client.post(
        "/users/",
        json={
            "email": f"member{uuid4().hex[:8]}@test.com",
            "password": "testpass123",
            "name": "Test Member",
            "role": "executor",
        },
    )
    assert response.status_code == 201, response.text
    return response.json()


class TestProjectCRUD:
    async def test_create_project(self, client, auth_headers):
        payload = _project_payload(description="A new test project")
        response = await client.post("/projects", json=payload, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()

        assert data["name"] == payload["name"]
        assert data["code"] == payload["code"].upper()
        assert data["description"] == payload["description"]
        assert data["status"] == "planning"
        assert {"id", "owner_id", "created_at"} <= data.keys()

    async def test_create_project_requires_auth(self, client):
        response = await client.post("/projects", json=_project_payload())
        assert response.status_code in (401, 403)

    async def test_create_project_invalid_code(self, client, auth_headers):
        response = await client.post(
            "/projects", json=_project_payload(code="bad code!"), headers=auth_headers
        )
        assert response.status_code == 422

    async def test_create_project_duplicate_code(self, client, auth_headers, created_project):
        response = await client.post(
            "/projects",
            json=_project_payload(code=created_project["code"]),
            headers=auth_headers,
        )
        assert response.status_code == 409
        assert "already exists" in response.json()["detail"]

    async def test_get_project(self, client, auth_headers, created_project):
        response = await client.get(f"/projects/{created_project['id']}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == created_project["id"]
        assert data["name"] == created_project["name"]
        assert "total_tasks" in data["stats"]

    async def test_get_project_by_code(self, client, auth_headers, created_project):
        response = await client.get(
            f"/projects/by-code/{created_project['code']}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["id"] == created_project["id"]

    async def test_get_project_not_found(self, client, auth_headers):
        response = await client.get(f"/projects/{uuid4()}", headers=auth_headers)
        assert response.status_code == 404

    async def test_list_projects(self, client, auth_headers, created_project):
        response = await client.get("/projects", headers=auth_headers)
        assert response.status_code == 200
        assert created_project["id"] in [p["id"] for p in response.json()]

    async def test_update_project(self, client, auth_headers, created_project):
        update = {
            "name": "Updated Project Name",
            "description": "Updated description",
            "status": "active",
        }
        response = await client.patch(
            f"/projects/{created_project['id']}", json=update, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update["name"]
        assert data["description"] == update["description"]
        assert data["status"] == "active"

    async def test_delete_project(self, client, auth_headers, created_project):
        response = await client.delete(f"/projects/{created_project['id']}", headers=auth_headers)
        assert response.status_code == 204

        response = await client.get(f"/projects/{created_project['id']}", headers=auth_headers)
        assert response.status_code == 404


class TestProjectMembers:
    async def test_owner_is_member(self, client, auth_headers, created_project):
        response = await client.get(
            f"/projects/{created_project['id']}/members", headers=auth_headers
        )
        assert response.status_code == 200
        owner = next(m for m in response.json() if m["user_id"] == created_project["owner_id"])
        assert owner["role"] == "owner"

    async def test_add_member(self, client, auth_headers, created_project, other_user):
        response = await client.post(
            f"/projects/{created_project['id']}/members",
            json={"user_id": other_user["id"], "role": "member"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        assert response.json()["user_id"] == other_user["id"]
        assert response.json()["role"] == "member"

    async def test_update_member_role(self, client, auth_headers, created_project, other_user):
        base = f"/projects/{created_project['id']}/members"
        await client.post(
            base, json={"user_id": other_user["id"], "role": "member"}, headers=auth_headers
        )
        response = await client.patch(
            f"{base}/{other_user['id']}", json={"role": "admin"}, headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["role"] == "admin"

    async def test_remove_member(self, client, auth_headers, created_project, other_user):
        base = f"/projects/{created_project['id']}/members"
        await client.post(
            base, json={"user_id": other_user["id"], "role": "member"}, headers=auth_headers
        )
        response = await client.delete(f"{base}/{other_user['id']}", headers=auth_headers)
        assert response.status_code == 204

        members = (await client.get(base, headers=auth_headers)).json()
        assert other_user["id"] not in [m["user_id"] for m in members]

    async def test_cannot_remove_owner(self, client, auth_headers, created_project):
        response = await client.delete(
            f"/projects/{created_project['id']}/members/{created_project['owner_id']}",
            headers=auth_headers,
        )
        assert response.status_code == 400
        assert "owner" in response.json()["detail"].lower()


class TestProjectFilters:
    async def test_filter_by_status(self, client, auth_headers):
        active = await client.post(
            "/projects", json=_project_payload(status="active"), headers=auth_headers
        )
        planning = await client.post(
            "/projects", json=_project_payload(status="planning"), headers=auth_headers
        )
        assert active.status_code == planning.status_code == 201

        response = await client.get("/projects?status=active", headers=auth_headers)
        assert response.status_code == 200
        ids = [p["id"] for p in response.json()]
        assert active.json()["id"] in ids
        assert planning.json()["id"] not in ids
        assert all(p["status"] == "active" for p in response.json())

    async def test_search_projects(self, client, auth_headers, created_project):
        response = await client.get(
            f"/projects?search={created_project['name'][:5]}", headers=auth_headers
        )
        assert response.status_code == 200
        assert created_project["id"] in [p["id"] for p in response.json()]


class TestProjectStats:
    async def test_project_stats(self, client, auth_headers, created_project):
        response = await client.get(f"/projects/{created_project['id']}", headers=auth_headers)
        assert response.status_code == 200
        stats = response.json()["stats"]
        assert {"total_tasks", "tasks_by_status", "completion_percentage", "total_members"} <= (
            stats.keys()
        )
