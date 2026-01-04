"""
SmartTask360 — Projects API tests
"""

import pytest
import httpx
from uuid import uuid4

import os

# Use backend container name when running inside Docker, localhost otherwise
BASE_URL = os.getenv("TEST_API_URL", "http://backend:8000/api/v1")

# Test data
test_project = {
    "name": "Test Project",
    "code": "TEST-001",
    "description": "Test project description",
    "status": "planning",
}

test_project_2 = {
    "name": "Another Project",
    "code": "TEST-002",
    "description": "Another test project",
    "status": "active",
}


@pytest.fixture
def auth_headers():
    """Get auth headers by logging in"""
    with httpx.Client(base_url=BASE_URL, timeout=10.0) as client:
        response = client.post(
            "/auth/login",
            json={"email": "admin@smarttask360.com", "password": "Admin123!"},
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def created_project(auth_headers):
    """Create a project for testing"""
    with httpx.Client(base_url=BASE_URL) as client:
        # Create unique project
        project_data = {
            "name": f"Test Project {uuid4().hex[:8]}",
            "code": f"TST{uuid4().hex[:5].upper()}",
            "description": "Test project",
            "status": "planning",
        }
        response = client.post("/projects", json=project_data, headers=auth_headers)
        assert response.status_code == 201
        project = response.json()
        yield project
        # Cleanup
        client.delete(f"/projects/{project['id']}", headers=auth_headers)


class TestProjectCRUD:
    """Test project CRUD operations"""

    def test_create_project(self, auth_headers):
        """Test creating a new project"""
        with httpx.Client(base_url=BASE_URL) as client:
            project_data = {
                "name": f"New Project {uuid4().hex[:8]}",
                "code": f"NEW{uuid4().hex[:5].upper()}",
                "description": "A new test project",
                "status": "planning",
            }
            response = client.post("/projects", json=project_data, headers=auth_headers)
            assert response.status_code == 201
            data = response.json()

            assert data["name"] == project_data["name"]
            assert data["code"] == project_data["code"].upper()
            assert data["description"] == project_data["description"]
            assert data["status"] == "planning"
            assert "id" in data
            assert "owner_id" in data
            assert "created_at" in data

            # Cleanup
            client.delete(f"/projects/{data['id']}", headers=auth_headers)

    def test_create_project_duplicate_code(self, auth_headers, created_project):
        """Test that duplicate project codes are rejected"""
        with httpx.Client(base_url=BASE_URL) as client:
            project_data = {
                "name": "Another Project",
                "code": created_project["code"],  # Same code
                "description": "Test",
            }
            response = client.post("/projects", json=project_data, headers=auth_headers)
            assert response.status_code == 409
            assert "already exists" in response.json()["detail"]

    def test_get_project(self, auth_headers, created_project):
        """Test getting a project by ID"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.get(
                f"/projects/{created_project['id']}", headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()

            assert data["id"] == created_project["id"]
            assert data["name"] == created_project["name"]
            assert "stats" in data
            assert "total_tasks" in data["stats"]

    def test_get_project_by_code(self, auth_headers, created_project):
        """Test getting a project by code"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.get(
                f"/projects/by-code/{created_project['code']}", headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()

            assert data["id"] == created_project["id"]
            assert data["code"] == created_project["code"]

    def test_get_project_not_found(self, auth_headers):
        """Test getting a non-existent project"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.get(f"/projects/{uuid4()}", headers=auth_headers)
            assert response.status_code == 404

    def test_list_projects(self, auth_headers, created_project):
        """Test listing projects"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.get("/projects", headers=auth_headers)
            assert response.status_code == 200
            data = response.json()

            assert isinstance(data, list)
            # Should contain at least the created project
            project_ids = [p["id"] for p in data]
            assert created_project["id"] in project_ids

    def test_update_project(self, auth_headers, created_project):
        """Test updating a project"""
        with httpx.Client(base_url=BASE_URL) as client:
            update_data = {
                "name": "Updated Project Name",
                "description": "Updated description",
                "status": "active",
            }
            response = client.patch(
                f"/projects/{created_project['id']}",
                json=update_data,
                headers=auth_headers,
            )
            assert response.status_code == 200
            data = response.json()

            assert data["name"] == update_data["name"]
            assert data["description"] == update_data["description"]
            assert data["status"] == "active"

    def test_delete_project(self, auth_headers):
        """Test deleting a project"""
        with httpx.Client(base_url=BASE_URL) as client:
            # Create project to delete
            project_data = {
                "name": f"To Delete {uuid4().hex[:8]}",
                "code": f"DEL{uuid4().hex[:5].upper()}",
            }
            create_response = client.post(
                "/projects", json=project_data, headers=auth_headers
            )
            assert create_response.status_code == 201
            project_id = create_response.json()["id"]

            # Delete
            delete_response = client.delete(
                f"/projects/{project_id}", headers=auth_headers
            )
            assert delete_response.status_code == 204

            # Verify deleted
            get_response = client.get(f"/projects/{project_id}", headers=auth_headers)
            assert get_response.status_code == 404


class TestProjectMembers:
    """Test project member operations"""

    def test_get_members(self, auth_headers, created_project):
        """Test getting project members (owner should be there)"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.get(
                f"/projects/{created_project['id']}/members", headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()

            assert isinstance(data, list)
            assert len(data) >= 1  # At least the owner

            # Check owner is there
            owner = next(
                (m for m in data if m["user_id"] == created_project["owner_id"]), None
            )
            assert owner is not None
            assert owner["role"] == "owner"

    def test_add_member(self, auth_headers, created_project):
        """Test adding a member to a project"""
        with httpx.Client(base_url=BASE_URL) as client:
            # First create a user
            user_data = {
                "email": f"member{uuid4().hex[:8]}@test.com",
                "password": "testpass123",
                "full_name": "Test Member",
            }
            user_response = client.post("/users", json=user_data, headers=auth_headers)
            if user_response.status_code == 201:
                user_id = user_response.json()["id"]

                # Add as member
                member_data = {"user_id": user_id, "role": "member"}
                response = client.post(
                    f"/projects/{created_project['id']}/members",
                    json=member_data,
                    headers=auth_headers,
                )
                assert response.status_code == 201
                data = response.json()

                assert data["user_id"] == user_id
                assert data["role"] == "member"

    def test_update_member_role(self, auth_headers, created_project):
        """Test updating a member's role"""
        with httpx.Client(base_url=BASE_URL) as client:
            # Create and add a member
            user_data = {
                "email": f"updatemember{uuid4().hex[:8]}@test.com",
                "password": "testpass123",
            }
            user_response = client.post("/users", json=user_data, headers=auth_headers)
            if user_response.status_code == 201:
                user_id = user_response.json()["id"]

                # Add as member
                client.post(
                    f"/projects/{created_project['id']}/members",
                    json={"user_id": user_id, "role": "member"},
                    headers=auth_headers,
                )

                # Update role
                response = client.patch(
                    f"/projects/{created_project['id']}/members/{user_id}",
                    json={"role": "admin"},
                    headers=auth_headers,
                )
                assert response.status_code == 200
                assert response.json()["role"] == "admin"

    def test_remove_member(self, auth_headers, created_project):
        """Test removing a member from a project"""
        with httpx.Client(base_url=BASE_URL) as client:
            # Create and add a member
            user_data = {
                "email": f"removemember{uuid4().hex[:8]}@test.com",
                "password": "testpass123",
            }
            user_response = client.post("/users", json=user_data, headers=auth_headers)
            if user_response.status_code == 201:
                user_id = user_response.json()["id"]

                # Add member
                client.post(
                    f"/projects/{created_project['id']}/members",
                    json={"user_id": user_id, "role": "member"},
                    headers=auth_headers,
                )

                # Remove member
                response = client.delete(
                    f"/projects/{created_project['id']}/members/{user_id}",
                    headers=auth_headers,
                )
                assert response.status_code == 204

    def test_cannot_remove_owner(self, auth_headers, created_project):
        """Test that owner cannot be removed"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.delete(
                f"/projects/{created_project['id']}/members/{created_project['owner_id']}",
                headers=auth_headers,
            )
            assert response.status_code == 400
            assert "owner" in response.json()["detail"].lower()


class TestProjectFilters:
    """Test project filtering"""

    def test_filter_by_status(self, auth_headers):
        """Test filtering projects by status"""
        with httpx.Client(base_url=BASE_URL) as client:
            # Create projects with different statuses
            project1 = {
                "name": f"Active Project {uuid4().hex[:8]}",
                "code": f"ACT{uuid4().hex[:5].upper()}",
                "status": "active",
            }
            project2 = {
                "name": f"Planning Project {uuid4().hex[:8]}",
                "code": f"PLN{uuid4().hex[:5].upper()}",
                "status": "planning",
            }

            r1 = client.post("/projects", json=project1, headers=auth_headers)
            r2 = client.post("/projects", json=project2, headers=auth_headers)

            if r1.status_code == 201 and r2.status_code == 201:
                p1_id = r1.json()["id"]
                p2_id = r2.json()["id"]

                # Filter by active
                response = client.get(
                    "/projects?status=active", headers=auth_headers
                )
                assert response.status_code == 200
                data = response.json()

                for p in data:
                    assert p["status"] == "active"

                # Cleanup
                client.delete(f"/projects/{p1_id}", headers=auth_headers)
                client.delete(f"/projects/{p2_id}", headers=auth_headers)

    def test_search_projects(self, auth_headers, created_project):
        """Test searching projects by name or code"""
        with httpx.Client(base_url=BASE_URL) as client:
            # Search by name part
            response = client.get(
                f"/projects?search={created_project['name'][:5]}", headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()

            project_ids = [p["id"] for p in data]
            assert created_project["id"] in project_ids


class TestProjectStats:
    """Test project statistics"""

    def test_project_stats(self, auth_headers, created_project):
        """Test that project has stats"""
        with httpx.Client(base_url=BASE_URL) as client:
            response = client.get(
                f"/projects/{created_project['id']}", headers=auth_headers
            )
            assert response.status_code == 200
            data = response.json()

            assert "stats" in data
            stats = data["stats"]
            assert "total_tasks" in stats
            assert "tasks_by_status" in stats
            assert "completion_percentage" in stats
            assert "total_members" in stats


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
