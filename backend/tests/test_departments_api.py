"""
Test Departments API endpoints with hierarchy
"""

import pytest


async def _create(client, headers, name, parent_id=None):
    payload = {"name": name, "description": f"{name} department"}
    if parent_id:
        payload["parent_id"] = parent_id
    response = await client.post("/departments/", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
async def depts(client, auth_headers):
    """Engineering -> (Backend -> API Team, Frontend); Sales"""
    engineering = await _create(client, auth_headers, "Engineering")
    sales = await _create(client, auth_headers, "Sales")
    backend = await _create(client, auth_headers, "Backend Team", engineering["id"])
    frontend = await _create(client, auth_headers, "Frontend Team", engineering["id"])
    api_team = await _create(client, auth_headers, "API Team", backend["id"])
    return {
        "engineering": engineering,
        "sales": sales,
        "backend": backend,
        "frontend": frontend,
        "api_team": api_team,
    }


async def test_create_departments_sets_depth(depts):
    assert depts["engineering"]["depth"] == 0
    assert depts["sales"]["depth"] == 0
    assert depts["backend"]["depth"] == 1
    assert depts["api_team"]["depth"] == 2
    assert depts["api_team"]["path"].count(".") == 2


async def test_create_requires_auth(client):
    response = await client.post("/departments/", json={"name": "X"})
    assert response.status_code in (401, 403)


async def test_create_with_unknown_parent(client, auth_headers):
    response = await client.post(
        "/departments/",
        json={"name": "Orphan", "parent_id": "00000000-0000-0000-0000-000000000000"},
        headers=auth_headers,
    )
    assert response.status_code in (400, 404)


async def test_get_all_departments(client, auth_headers, depts):
    response = await client.get("/departments/", headers=auth_headers)
    assert response.status_code == 200
    assert {d["name"] for d in response.json()} == {
        "Engineering",
        "Sales",
        "Backend Team",
        "Frontend Team",
        "API Team",
    }


async def test_get_root_departments(client, auth_headers, depts):
    response = await client.get("/departments/roots", headers=auth_headers)
    assert response.status_code == 200
    assert {d["name"] for d in response.json()} == {"Engineering", "Sales"}


async def test_get_children(client, auth_headers, depts):
    response = await client.get(
        f"/departments/{depts['engineering']['id']}/children", headers=auth_headers
    )
    assert response.status_code == 200
    assert {d["name"] for d in response.json()} == {"Backend Team", "Frontend Team"}


async def test_get_descendants(client, auth_headers, depts):
    response = await client.get(
        f"/departments/{depts['engineering']['id']}/descendants", headers=auth_headers
    )
    assert response.status_code == 200
    assert {d["name"] for d in response.json()} == {"Backend Team", "Frontend Team", "API Team"}


async def test_get_ancestors(client, auth_headers, depts):
    response = await client.get(
        f"/departments/{depts['api_team']['id']}/ancestors", headers=auth_headers
    )
    assert response.status_code == 200
    assert {d["name"] for d in response.json()} == {"Engineering", "Backend Team"}


async def test_update_department(client, auth_headers, depts):
    response = await client.patch(
        f"/departments/{depts['backend']['id']}",
        json={"name": "Backend Engineering Team"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Backend Engineering Team"


async def test_delete_department_cascades(client, auth_headers, depts):
    response = await client.delete(
        f"/departments/{depts['backend']['id']}", headers=auth_headers
    )
    assert response.status_code == 204

    response = await client.get(f"/departments/{depts['api_team']['id']}", headers=auth_headers)
    assert response.status_code == 404
