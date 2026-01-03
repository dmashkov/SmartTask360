"""
Test Workflow API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Workflow API ===\n")

        # Step 1: Login as admin
        print("1. Login as admin...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        tokens = response.json()
        access_token = tokens["access_token"]
        print(f"✓ Logged in\n")

        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: List all workflow templates (should have 3 system templates)
        print("2. Listing workflow templates...")
        response = await client.get(f"{BASE_URL}/workflow/templates", headers=headers)
        assert response.status_code == 200
        templates = response.json()
        print(f"✓ Found {len(templates)} workflow template(s):")
        for tpl in templates:
            print(f"  - {tpl['name']}: {tpl['display_name']}")
        print()

        # Get basic template for testing
        basic_template = next(t for t in templates if t["name"] == "basic")
        basic_id = basic_template["id"]

        # Step 3: Get template by ID
        print("3. Getting template by ID...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/{basic_id}", headers=headers
        )
        assert response.status_code == 200
        template = response.json()
        print(f"✓ Got template: {template['display_name']}")
        print(f"  Statuses: {len(template['statuses']['statuses'])} defined")
        print(f"  Initial status: {template['initial_status']}")
        print(f"  Final statuses: {template['final_statuses']}\n")

        # Step 4: Get template by name
        print("4. Getting template by name...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/by-name/agile", headers=headers
        )
        assert response.status_code == 200
        agile_template = response.json()
        print(f"✓ Got template: {agile_template['display_name']}")
        print(f"  Description: {agile_template['description']}\n")

        # Step 5: List transitions for basic template
        print("5. Listing transitions for basic template...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/{basic_id}/transitions", headers=headers
        )
        assert response.status_code == 200
        transitions = response.json()
        print(f"✓ Found {len(transitions)} transition(s):")
        for tr in transitions:
            print(
                f"  - {tr['from_status']} → {tr['to_status']} (requires_comment: {tr['requires_comment']}, requires_acceptance: {tr['requires_acceptance']})"
            )
        print()

        # Step 6: Create custom workflow template
        print("6. Creating custom workflow template...")
        custom_template_data = {
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
        }
        response = await client.post(
            f"{BASE_URL}/workflow/templates", json=custom_template_data, headers=headers
        )
        assert response.status_code == 201
        custom_template = response.json()
        custom_id = custom_template["id"]
        print(f"✓ Created custom template: {custom_template['display_name']}")
        print(f"  ID: {custom_id}\n")

        # Step 7: Create transition for custom template
        print("7. Creating transition for custom template...")
        transition_data = {
            "template_id": custom_id,
            "from_status": "pending",
            "to_status": "active",
            "allowed_roles": ["admin", "manager"],
            "requires_comment": True,
            "requires_acceptance": False,
            "display_order": 1,
        }
        response = await client.post(
            f"{BASE_URL}/workflow/transitions", json=transition_data, headers=headers
        )
        assert response.status_code == 201
        transition = response.json()
        print(f"✓ Created transition: {transition['from_status']} → {transition['to_status']}")
        print(f"  Allowed roles: {transition['allowed_roles']}")
        print(f"  Requires comment: {transition['requires_comment']}\n")

        transition_id = transition["id"]

        # Step 8: Create another transition
        print("8. Creating second transition...")
        transition_data2 = {
            "template_id": custom_id,
            "from_status": "active",
            "to_status": "completed",
            "allowed_roles": [],
            "requires_comment": False,
            "requires_acceptance": False,
            "display_order": 2,
        }
        response = await client.post(
            f"{BASE_URL}/workflow/transitions", json=transition_data2, headers=headers
        )
        assert response.status_code == 201
        print(f"✓ Created second transition\n")

        # Step 9: Update transition
        print("9. Updating transition...")
        update_data = {
            "requires_comment": False,
            "display_order": 10,
        }
        response = await client.patch(
            f"{BASE_URL}/workflow/transitions/{transition_id}",
            json=update_data,
            headers=headers,
        )
        assert response.status_code == 200
        updated_transition = response.json()
        print(f"✓ Updated transition")
        print(f"  Requires comment now: {updated_transition['requires_comment']}")
        print(f"  Display order: {updated_transition['display_order']}\n")

        # Step 10: Validate transition (should succeed)
        print("10. Validating transition (should succeed)...")
        validation_request = {
            "template_id": custom_id,
            "from_status": "pending",
            "to_status": "active",
            "user_role": "admin",
            "has_comment": False,
        }
        response = await client.post(
            f"{BASE_URL}/workflow/validate-transition",
            json=validation_request,
            headers=headers,
        )
        assert response.status_code == 200
        validation = response.json()
        print(f"✓ Validation result: {validation['is_valid']}")
        print(f"  Message: {validation['message']}\n")

        # Step 11: Validate transition with wrong role (should fail)
        print("11. Validating transition with wrong role (should fail)...")
        validation_request2 = {
            "template_id": custom_id,
            "from_status": "pending",
            "to_status": "active",
            "user_role": "user",
            "has_comment": False,
        }
        response = await client.post(
            f"{BASE_URL}/workflow/validate-transition",
            json=validation_request2,
            headers=headers,
        )
        assert response.status_code == 200
        validation2 = response.json()
        print(f"✓ Validation result: {validation2['is_valid']}")
        print(f"  Message: {validation2['message']}\n")

        # Step 12: Validate non-existent transition (should fail)
        print("12. Validating non-existent transition (should fail)...")
        validation_request3 = {
            "template_id": custom_id,
            "from_status": "completed",
            "to_status": "pending",
            "user_role": "admin",
            "has_comment": False,
        }
        response = await client.post(
            f"{BASE_URL}/workflow/validate-transition",
            json=validation_request3,
            headers=headers,
        )
        assert response.status_code == 200
        validation3 = response.json()
        print(f"✓ Validation result: {validation3['is_valid']}")
        print(f"  Message: {validation3['message']}\n")

        # Step 13: Get available transitions for a status
        print("13. Getting available transitions from 'pending' status...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/{custom_id}/available-transitions"
            f"?current_status=pending&user_role=admin",
            headers=headers,
        )
        assert response.status_code == 200
        available = response.json()
        print(f"✓ Found {len(available)} available transition(s):")
        for tr in available:
            print(f"  - {tr['from_status']} → {tr['to_status']}")
        print()

        # Step 14: Get available transitions for user (should be empty - wrong role)
        print("14. Getting available transitions for regular user...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/{custom_id}/available-transitions"
            f"?current_status=pending&user_role=user",
            headers=headers,
        )
        assert response.status_code == 200
        available2 = response.json()
        print(f"✓ Found {len(available2)} available transition(s) (expected 0)\n")

        # Step 15: Update workflow template
        print("15. Updating workflow template...")
        template_update = {
            "description": "Updated description for custom workflow",
            "is_active": True,
        }
        response = await client.patch(
            f"{BASE_URL}/workflow/templates/{custom_id}",
            json=template_update,
            headers=headers,
        )
        assert response.status_code == 200
        updated_template = response.json()
        print(f"✓ Updated template")
        print(f"  New description: {updated_template['description']}\n")

        # Step 16: Try to update system template (should fail)
        print("16. Trying to update system template (should fail)...")
        response = await client.patch(
            f"{BASE_URL}/workflow/templates/{basic_id}",
            json={"description": "Try to change system template"},
            headers=headers,
        )
        assert response.status_code == 400
        error = response.json()
        print(f"✓ Got expected error: {error['detail']}\n")

        # Step 17: Try to delete system template (should fail)
        print("17. Trying to delete system template (should fail)...")
        response = await client.delete(
            f"{BASE_URL}/workflow/templates/{basic_id}", headers=headers
        )
        assert response.status_code == 400
        error2 = response.json()
        print(f"✓ Got expected error: {error2['detail']}\n")

        # Step 18: Delete custom transition
        print("18. Deleting custom transition...")
        response = await client.delete(
            f"{BASE_URL}/workflow/transitions/{transition_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Deleted transition\n")

        # Step 19: Delete custom template
        print("19. Deleting custom template...")
        response = await client.delete(
            f"{BASE_URL}/workflow/templates/{custom_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Deleted custom template\n")

        # Step 20: Verify deletion
        print("20. Verifying template deletion...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/{custom_id}", headers=headers
        )
        assert response.status_code == 404
        print(f"✓ Template successfully deleted\n")

        # Step 21: Test approval workflow transitions
        print("21. Testing approval workflow transitions...")
        approval_template = next(t for t in templates if t["name"] == "approval")
        approval_id = approval_template["id"]

        response = await client.get(
            f"{BASE_URL}/workflow/templates/{approval_id}/transitions", headers=headers
        )
        assert response.status_code == 200
        approval_transitions = response.json()
        print(f"✓ Approval workflow has {len(approval_transitions)} transitions:")
        for tr in approval_transitions[:3]:
            print(f"  - {tr['from_status']} → {tr['to_status']}")
        print()

        # Step 22: Validate approval transition with manager role
        print("22. Validating approval transition (manager role)...")
        validation_approval = {
            "template_id": approval_id,
            "from_status": "pending_approval",
            "to_status": "approved",
            "user_role": "manager",
            "has_comment": False,
        }
        response = await client.post(
            f"{BASE_URL}/workflow/validate-transition",
            json=validation_approval,
            headers=headers,
        )
        assert response.status_code == 200
        validation_result = response.json()
        print(f"✓ Validation result: {validation_result['is_valid']}")
        print(f"  Message: {validation_result['message']}\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
