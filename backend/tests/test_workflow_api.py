"""
Test Workflow API endpoints (templates, transitions, validation)
"""

import pytest


@pytest.fixture
async def templates(client, auth_headers) -> dict[str, dict]:
    response = await client.get("/workflow/templates", headers=auth_headers)
    assert response.status_code == 200
    return {t["name"]: t for t in response.json()}


@pytest.fixture
async def custom_template(client, auth_headers) -> dict:
    response = await client.post(
        "/workflow/templates",
        json={
            "name": "custom_test",
            "display_name": "Custom Test Workflow",
            "description": "Custom workflow for testing",
            "statuses": [
                {"key": "pending", "label": "Pending", "color": "#CCCCCC"},
                {"key": "active", "label": "Active", "color": "#00FF00"},
                {"key": "completed", "label": "Completed", "color": "#0000FF"},
            ],
            "initial_status": "pending",
            "final_statuses": ["completed"],
        },
        headers=auth_headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


@pytest.fixture
async def add_transition(client, auth_headers, custom_template):
    async def _add(from_status, to_status, **extra) -> dict:
        response = await client.post(
            "/workflow/transitions",
            json={
                "template_id": custom_template["id"],
                "from_status": from_status,
                "to_status": to_status,
                "allowed_roles": [],
                "requires_comment": False,
                "requires_acceptance": False,
                **extra,
            },
            headers=auth_headers,
        )
        assert response.status_code == 201, response.text
        return response.json()

    return _add


async def _validate(client, headers, template_id, from_status, to_status, role, comment=False):
    response = await client.post(
        "/workflow/validate-transition",
        json={
            "template_id": template_id,
            "from_status": from_status,
            "to_status": to_status,
            "user_role": role,
            "has_comment": comment,
        },
        headers=headers,
    )
    assert response.status_code == 200, response.text
    return response.json()


async def test_system_templates_exist(templates):
    assert {"basic", "agile", "approval"} <= templates.keys()


async def test_get_template_by_id_and_name(client, auth_headers, templates):
    basic = templates["basic"]
    response = await client.get(f"/workflow/templates/{basic['id']}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "basic"

    response = await client.get("/workflow/templates/by-name/agile", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "agile"


async def test_basic_template_transitions(client, auth_headers, templates):
    response = await client.get(
        f"/workflow/templates/{templates['basic']['id']}/transitions", headers=auth_headers
    )
    assert response.status_code == 200
    pairs = {(t["from_status"], t["to_status"]) for t in response.json()}
    assert ("in_progress", "in_review") in pairs


async def test_create_transition_and_update(client, auth_headers, add_transition):
    transition = await add_transition("pending", "active", requires_comment=True, display_order=1)
    response = await client.patch(
        f"/workflow/transitions/{transition['id']}",
        json={"requires_comment": False, "display_order": 10},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["requires_comment"] is False
    assert response.json()["display_order"] == 10


async def test_validate_role_restriction(client, auth_headers, custom_template, add_transition):
    await add_transition("pending", "active", allowed_roles=["admin", "manager"])
    tid = custom_template["id"]

    assert (await _validate(client, auth_headers, tid, "pending", "active", "admin"))["is_valid"]
    assert not (await _validate(client, auth_headers, tid, "pending", "active", "executor"))[
        "is_valid"
    ]


async def test_validate_requires_comment(client, auth_headers, custom_template, add_transition):
    await add_transition("pending", "active", requires_comment=True)
    tid = custom_template["id"]

    without = await _validate(client, auth_headers, tid, "pending", "active", "admin")
    with_comment = await _validate(client, auth_headers, tid, "pending", "active", "admin", True)
    assert not without["is_valid"]
    assert with_comment["is_valid"]


async def test_validate_undefined_transition(client, auth_headers, custom_template, add_transition):
    await add_transition("pending", "active")
    result = await _validate(
        client, auth_headers, custom_template["id"], "completed", "pending", "admin"
    )
    assert not result["is_valid"]


async def test_available_transitions_filtered_by_role(
    client, auth_headers, custom_template, add_transition
):
    await add_transition("pending", "active", allowed_roles=["admin"])
    url = f"/workflow/templates/{custom_template['id']}/available-transitions"

    admin = await client.get(
        f"{url}?current_status=pending&user_role=admin", headers=auth_headers
    )
    other = await client.get(
        f"{url}?current_status=pending&user_role=executor", headers=auth_headers
    )
    assert admin.status_code == other.status_code == 200
    assert len(admin.json()) == 1
    assert other.json() == []


async def test_update_custom_template(client, auth_headers, custom_template):
    response = await client.patch(
        f"/workflow/templates/{custom_template['id']}",
        json={"description": "Updated description"},
        headers=auth_headers,
    )
    assert response.status_code == 200
    assert response.json()["description"] == "Updated description"


async def test_system_template_is_protected(client, auth_headers, templates):
    basic_id = templates["basic"]["id"]
    patch = await client.patch(
        f"/workflow/templates/{basic_id}", json={"description": "hack"}, headers=auth_headers
    )
    delete = await client.delete(f"/workflow/templates/{basic_id}", headers=auth_headers)
    assert patch.status_code == 400
    assert delete.status_code == 400


async def test_delete_transition_and_template(client, auth_headers, custom_template, add_transition):
    transition = await add_transition("pending", "active")
    assert (
        await client.delete(f"/workflow/transitions/{transition['id']}", headers=auth_headers)
    ).status_code == 204
    assert (
        await client.delete(f"/workflow/templates/{custom_template['id']}", headers=auth_headers)
    ).status_code == 204
    assert (
        await client.get(f"/workflow/templates/{custom_template['id']}", headers=auth_headers)
    ).status_code == 404


async def test_approval_template_manager_can_approve(client, auth_headers, templates):
    result = await _validate(
        client, auth_headers, templates["approval"]["id"], "pending_approval", "approved", "manager"
    )
    assert "is_valid" in result
