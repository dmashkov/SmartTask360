"""
Test Enhanced SMART Validation API
Tests new features: auto-save scores, validation history, apply suggestions
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=== Testing Enhanced SMART Validation ===\n")

        # Login
        print("1. Login...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        access_token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {access_token}"}
        print("✓ Logged in\n")

        # Create task
        print("2. Creating task...")
        task_data = {
            "title": "Build microservices architecture",
            "description": "Refactor monolith into services",
            "priority": "high",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Task created: {task_id}")
        print(f"  SMART score before: {task.get('smart_score')}")
        print(f"  SMART is_valid before: {task.get('smart_is_valid')}\n")

        # Run SMART validation (with real API if configured)
        print("3. Running SMART validation...")
        validation_request = {"task_id": task_id, "include_context": True}
        response = await client.post(
            f"{BASE_URL}/ai/validate-smart",
            json=validation_request,
            headers=headers,
        )

        if response.status_code == 200:
            result = response.json()
            conversation_id = result["conversation_id"]
            validation = result["validation"]

            print("✓ SMART Validation completed")
            print(f"  Conversation ID: {conversation_id}")
            print(f"  Overall Score: {validation['overall_score']:.2f}")
            print(f"  Is Valid: {validation['is_valid']}")
            print(f"  Criteria count: {len(validation['criteria'])}")
            print(f"  Recommendations: {len(validation['recommended_changes'])}\n")

            # Check task updated with SMART score
            print("4. Checking task updated with SMART score...")
            response = await client.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
            assert response.status_code == 200
            updated_task = response.json()

            assert updated_task["smart_score"] is not None
            assert updated_task["smart_is_valid"] is not None
            assert updated_task["smart_validated_at"] is not None

            print("✓ Task SMART fields updated:")
            print(f"  smart_is_valid: {updated_task['smart_is_valid']}")
            print(f"  smart_validated_at: {updated_task['smart_validated_at']}")
            print(f"  smart_score keys: {list(updated_task['smart_score'].keys())}\n")

            # Get SMART validation history
            print("5. Getting SMART validation history...")
            response = await client.get(
                f"{BASE_URL}/ai/tasks/{task_id}/smart-validations",
                headers=headers,
            )
            assert response.status_code == 200
            validations = response.json()

            print(f"✓ Found {len(validations)} SMART validation(s)")
            if validations:
                latest = validations[0]
                print(f"  Latest validation ID: {latest['id']}")
                print(f"  Status: {latest['status']}")
                print(f"  Created: {latest['created_at']}\n")

            # Apply AI suggestions
            print("6. Applying AI suggestions to task...")
            response = await client.post(
                f"{BASE_URL}/ai/tasks/{task_id}/apply-smart-suggestions",
                params={"conversation_id": conversation_id},
                headers=headers,
            )

            if response.status_code == 200:
                apply_result = response.json()
                print("✓ AI suggestions applied:")
                print(f"  Success: {apply_result['success']}")
                print(f"  Message: {apply_result['message']}")
                print(f"  Recommendations applied: {len(apply_result['recommendations_applied'])}")

                # Check task description updated
                response = await client.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
                final_task = response.json()
                print(f"\n  Updated description length: {len(final_task['description'])} chars")
                print(f"  Contains 'AI Recommended': {'AI Recommended' in final_task['description']}\n")
            else:
                print(f"✗ Failed to apply suggestions: {response.status_code}")
                print(f"  Error: {response.text}\n")

            # Run second validation to create history
            print("7. Running second SMART validation (for history)...")
            updated_task_data = {
                "description": final_task["description"] + "\n\nEstimated timeline: 2 weeks"
            }
            response = await client.patch(
                f"{BASE_URL}/tasks/{task_id}",
                json=updated_task_data,
                headers=headers,
            )

            response = await client.post(
                f"{BASE_URL}/ai/validate-smart",
                json={"task_id": task_id, "include_context": False},
                headers=headers,
            )

            if response.status_code == 200:
                result2 = response.json()
                validation2 = result2["validation"]
                print("✓ Second validation completed")
                print(f"  New score: {validation2['overall_score']:.2f}")

                # Check history now has 2 entries
                response = await client.get(
                    f"{BASE_URL}/ai/tasks/{task_id}/smart-validations",
                    headers=headers,
                )
                validations = response.json()
                print(f"  Total validations in history: {len(validations)}\n")

        else:
            print(f"✗ SMART validation failed: {response.status_code}")
            print(f"  {response.text}\n")

        # Cleanup
        print("Cleanup: Deleting task...")
        await client.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        print("✓ Done\n")

        print("=== All Enhanced SMART Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
