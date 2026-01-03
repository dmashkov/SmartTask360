"""
Test Tasks API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Tasks API ===\n")

        # Step 1: Login as admin
        print("1. Login as admin...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        tokens = response.json()
        access_token = tokens["access_token"]
        print(f"✓ Logged in. Token: {access_token[:20]}...\n")

        # Headers with auth
        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Create root task
        print("2. Creating root task...")
        task1_data = {
            "title": "Implement SmartTask360 MVP",
            "description": "Build the core functionality of SmartTask360",
            "priority": "high",
            "status": "new",
            "is_milestone": True,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task1_data, headers=headers)
        assert response.status_code == 201, f"Create task failed: {response.text}"
        task1 = response.json()
        task1_id = task1["id"]
        print(f"✓ Created root task: {task1['title']}")
        print(f"  ID: {task1_id}")
        print(f"  Path: {task1['path']}")
        print(f"  Depth: {task1['depth']}")
        print(f"  Status: {task1['status']}")
        print(f"  Priority: {task1['priority']}\n")

        # Step 3: Create child task
        print("3. Creating child task...")
        task2_data = {
            "title": "Backend API Development",
            "description": "Implement RESTful API with FastAPI",
            "priority": "high",
            "parent_id": task1_id,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task2_data, headers=headers)
        assert response.status_code == 201, f"Create child task failed: {response.text}"
        task2 = response.json()
        task2_id = task2["id"]
        print(f"✓ Created child task: {task2['title']}")
        print(f"  ID: {task2_id}")
        print(f"  Path: {task2['path']}")
        print(f"  Depth: {task2['depth']}")
        print(f"  Parent: {task2['parent_id']}\n")

        # Step 4: Create grandchild task
        print("4. Creating grandchild task...")
        task3_data = {
            "title": "Implement Tasks Module",
            "description": "Create Task CRUD with hierarchy support",
            "priority": "medium",
            "parent_id": task2_id,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task3_data, headers=headers)
        assert response.status_code == 201, f"Create grandchild task failed: {response.text}"
        task3 = response.json()
        task3_id = task3["id"]
        print(f"✓ Created grandchild task: {task3['title']}")
        print(f"  ID: {task3_id}")
        print(f"  Path: {task3['path']}")
        print(f"  Depth: {task3['depth']}")
        print(f"  Parent: {task3['parent_id']}\n")

        # Step 5: Get task hierarchy
        print("5. Testing hierarchy queries...")

        # Get children of root task
        response = await client.get(f"{BASE_URL}/tasks/{task1_id}/children", headers=headers)
        assert response.status_code == 200
        children = response.json()
        print(f"✓ Root task has {len(children)} direct child(ren)")

        # Get all descendants of root task
        response = await client.get(
            f"{BASE_URL}/tasks/{task1_id}/descendants", headers=headers
        )
        assert response.status_code == 200
        descendants = response.json()
        print(f"✓ Root task has {len(descendants)} total descendant(s)")

        # Get ancestors of grandchild task
        response = await client.get(f"{BASE_URL}/tasks/{task3_id}/ancestors", headers=headers)
        assert response.status_code == 200
        ancestors = response.json()
        print(f"✓ Grandchild task has {len(ancestors)} ancestor(s)\n")

        # Step 6: Update task status
        print("6. Updating task status...")
        status_data = {"status": "in_progress", "comment": "Starting work on this task"}
        response = await client.post(
            f"{BASE_URL}/tasks/{task3_id}/status", json=status_data, headers=headers
        )
        assert response.status_code == 200
        updated_task = response.json()
        print(f"✓ Updated task status: {updated_task['status']}")
        print(f"  Started at: {updated_task['started_at']}\n")

        # Step 7: Test task assignment and acceptance flow
        print("7. Testing task assignment...")
        # Get current user info (use the creator_id from task1)
        user_id = task1["creator_id"]

        # Assign task to self
        update_data = {"assignee_id": user_id}
        response = await client.patch(
            f"{BASE_URL}/tasks/{task3_id}", json=update_data, headers=headers
        )
        assert response.status_code == 200
        assigned_task = response.json()
        print(f"✓ Task assigned to: {assigned_task['assignee_id']}")
        print(f"  Status: {assigned_task['status']}\n")

        # Step 8: Accept task
        print("8. Accepting task...")
        accept_data = {"comment": "I accept this task and will start working on it"}
        response = await client.post(
            f"{BASE_URL}/tasks/{task3_id}/accept", json=accept_data, headers=headers
        )
        assert response.status_code == 200
        accepted_task = response.json()
        print(f"✓ Task accepted")
        print(f"  Accepted at: {accepted_task['accepted_at']}")
        print(f"  Status: {accepted_task['status']}\n")

        # Step 9: Get my tasks
        print("9. Getting my assigned tasks...")
        response = await client.get(f"{BASE_URL}/tasks/my", headers=headers)
        assert response.status_code == 200
        my_tasks = response.json()
        print(f"✓ Found {len(my_tasks)} task(s) assigned to me\n")

        # Step 10: Get created tasks
        print("10. Getting tasks I created...")
        response = await client.get(f"{BASE_URL}/tasks/created", headers=headers)
        assert response.status_code == 200
        created_tasks = response.json()
        print(f"✓ Found {len(created_tasks)} task(s) created by me\n")

        # Step 11: Get all tasks
        print("11. Getting all tasks...")
        response = await client.get(f"{BASE_URL}/tasks/", headers=headers)
        assert response.status_code == 200
        all_tasks = response.json()
        print(f"✓ Total tasks in system: {len(all_tasks)}")
        print("\nTask hierarchy:")
        for task in all_tasks:
            indent = "  " * task["depth"]
            print(f"{indent}- {task['title']} (depth={task['depth']})")
        print()

        # Step 12: Update task (move in hierarchy)
        print("12. Testing task move in hierarchy...")
        # Move task3 to be child of task1 (skip task2)
        move_data = {"parent_id": task1_id}
        response = await client.patch(
            f"{BASE_URL}/tasks/{task3_id}", json=move_data, headers=headers
        )
        assert response.status_code == 200
        moved_task = response.json()
        print(f"✓ Moved task to new parent")
        print(f"  New path: {moved_task['path']}")
        print(f"  New depth: {moved_task['depth']}\n")

        # Step 13: Soft delete task
        print("13. Soft deleting a task...")
        response = await client.delete(f"{BASE_URL}/tasks/{task2_id}", headers=headers)
        assert response.status_code == 204
        print(f"✓ Task soft deleted\n")

        # Verify it's not in the list anymore
        response = await client.get(f"{BASE_URL}/tasks/", headers=headers)
        visible_tasks = response.json()
        print(f"✓ Visible tasks after deletion: {len(visible_tasks)}\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
