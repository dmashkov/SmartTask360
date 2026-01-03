"""
Test Tags API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Tags API ===\n")

        # Step 1: Login as admin
        print("1. Login as admin...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        tokens = response.json()
        access_token = tokens["access_token"]
        print(f"✓ Logged in\n")

        # Headers with auth
        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Create tags
        print("2. Creating tags...")
        tag1_data = {"name": "Backend", "color": "#3B82F6"}
        response = await client.post(f"{BASE_URL}/tags/", json=tag1_data, headers=headers)
        assert response.status_code == 201
        tag1 = response.json()
        tag1_id = tag1["id"]
        print(f"✓ Created tag: {tag1['name']} (color: {tag1['color']})")

        tag2_data = {"name": "Frontend", "color": "#10B981"}
        response = await client.post(f"{BASE_URL}/tags/", json=tag2_data, headers=headers)
        assert response.status_code == 201
        tag2 = response.json()
        tag2_id = tag2["id"]
        print(f"✓ Created tag: {tag2['name']} (color: {tag2['color']})")

        tag3_data = {"name": "Bug", "color": "#EF4444"}
        response = await client.post(f"{BASE_URL}/tags/", json=tag3_data, headers=headers)
        assert response.status_code == 201
        tag3 = response.json()
        tag3_id = tag3["id"]
        print(f"✓ Created tag: {tag3['name']} (color: {tag3['color']})\n")

        # Step 3: Get all tags
        print("3. Getting all tags...")
        response = await client.get(f"{BASE_URL}/tags/", headers=headers)
        assert response.status_code == 200
        all_tags = response.json()
        print(f"✓ Found {len(all_tags)} tags\n")

        # Step 4: Get tag by ID
        print("4. Getting tag by ID...")
        response = await client.get(f"{BASE_URL}/tags/{tag1_id}", headers=headers)
        assert response.status_code == 200
        tag = response.json()
        print(f"✓ Retrieved tag: {tag['name']}\n")

        # Step 5: Update tag
        print("5. Updating tag...")
        update_data = {"color": "#8B5CF6"}
        response = await client.patch(
            f"{BASE_URL}/tags/{tag1_id}", json=update_data, headers=headers
        )
        assert response.status_code == 200
        updated_tag = response.json()
        print(f"✓ Updated tag color: {updated_tag['color']}\n")

        # Step 6: Create a task for testing tag assignment
        print("6. Creating a task...")
        task_data = {
            "title": "Fix authentication bug",
            "description": "Users cannot login with special characters in password",
            "priority": "high",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Created task: {task['title']}\n")

        # Step 7: Assign tags to task
        print("7. Assigning tags to task...")
        assign_data = {"tag_ids": [tag1_id, tag3_id]}  # Backend + Bug
        response = await client.post(
            f"{BASE_URL}/tags/tasks/{task_id}/tags", json=assign_data, headers=headers
        )
        assert response.status_code == 200
        assigned_tags = response.json()
        print(f"✓ Assigned {len(assigned_tags)} tags to task")
        for tag in assigned_tags:
            print(f"  - {tag['name']}")
        print()

        # Step 8: Get task tags
        print("8. Getting task tags...")
        response = await client.get(f"{BASE_URL}/tags/tasks/{task_id}/tags", headers=headers)
        assert response.status_code == 200
        task_tags = response.json()
        print(f"✓ Task has {len(task_tags)} tags\n")

        # Step 9: Add another tag to task
        print("9. Adding another tag to task...")
        response = await client.put(
            f"{BASE_URL}/tags/tasks/{task_id}/tags/{tag2_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Added Frontend tag to task\n")

        # Verify
        response = await client.get(f"{BASE_URL}/tags/tasks/{task_id}/tags", headers=headers)
        task_tags = response.json()
        print(f"✓ Task now has {len(task_tags)} tags")
        for tag in task_tags:
            print(f"  - {tag['name']}")
        print()

        # Step 10: Remove a tag from task
        print("10. Removing a tag from task...")
        response = await client.delete(
            f"{BASE_URL}/tags/tasks/{task_id}/tags/{tag3_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Removed Bug tag from task\n")

        # Verify
        response = await client.get(f"{BASE_URL}/tags/tasks/{task_id}/tags", headers=headers)
        task_tags = response.json()
        print(f"✓ Task now has {len(task_tags)} tags")
        for tag in task_tags:
            print(f"  - {tag['name']}")
        print()

        # Step 11: Replace all tags (assign_tags_to_task)
        print("11. Replacing all tags on task...")
        assign_data = {"tag_ids": [tag3_id]}  # Only Bug
        response = await client.post(
            f"{BASE_URL}/tags/tasks/{task_id}/tags", json=assign_data, headers=headers
        )
        assert response.status_code == 200
        assigned_tags = response.json()
        print(f"✓ Replaced tags with {len(assigned_tags)} tag(s)")
        for tag in assigned_tags:
            print(f"  - {tag['name']}")
        print()

        # Step 12: Soft delete tag
        print("12. Soft deleting a tag...")
        response = await client.delete(f"{BASE_URL}/tags/{tag2_id}", headers=headers)
        assert response.status_code == 204
        print(f"✓ Tag soft deleted\n")

        # Verify it's not in the active list
        response = await client.get(f"{BASE_URL}/tags/?active_only=true", headers=headers)
        active_tags = response.json()
        print(f"✓ Active tags: {len(active_tags)}\n")

        # Step 13: Test duplicate tag name
        print("13. Testing duplicate tag creation...")
        duplicate_data = {"name": "Backend", "color": "#000000"}
        response = await client.post(
            f"{BASE_URL}/tags/", json=duplicate_data, headers=headers
        )
        assert response.status_code == 400
        print(f"✓ Correctly rejected duplicate tag name\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
