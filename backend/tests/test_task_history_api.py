"""
Test Task History API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Task History API ===\n")

        # Step 1: Login as admin
        print("1. Login as admin...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        tokens = response.json()
        access_token = tokens["access_token"]
        admin_user = response.json()
        print(f"✓ Logged in\n")

        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Create a task (this should create history entry)
        print("2. Creating a task...")
        task_data = {
            "title": "Implement audit logging",
            "description": "Track all changes to tasks",
            "priority": "high",
            "status": "new",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Created task: {task['title']}\n")

        # Step 3: Manually create history entry for task creation
        print("3. Creating history entry for task creation...")
        history_data = {
            "task_id": task_id,
            "action": "created",
            "comment": "Task was created",
            "new_value": {
                "title": task_data["title"],
                "status": task_data["status"],
                "priority": task_data["priority"],
            },
        }
        response = await client.post(
            f"{BASE_URL}/task-history/", json=history_data, headers=headers
        )
        assert response.status_code == 201
        history1 = response.json()
        print(f"✓ Created history entry: {history1['action']}\n")

        # Step 4: Create status change history entry
        print("4. Logging status change...")
        status_change_data = {
            "task_id": task_id,
            "action": "status_changed",
            "field_name": "status",
            "old_value": {"value": "new"},
            "new_value": {"value": "in_progress"},
            "comment": "Status changed from new to in_progress",
        }
        response = await client.post(
            f"{BASE_URL}/task-history/", json=status_change_data, headers=headers
        )
        assert response.status_code == 201
        print(f"✓ Logged status change\n")

        # Step 5: Create assignment change history entry
        print("5. Logging assignment change...")
        assignment_data = {
            "task_id": task_id,
            "action": "assigned",
            "field_name": "assignee_id",
            "new_value": {"value": "user-123"},
            "comment": "Task assigned to user",
        }
        response = await client.post(
            f"{BASE_URL}/task-history/", json=assignment_data, headers=headers
        )
        assert response.status_code == 201
        print(f"✓ Logged assignment\n")

        # Step 6: Create field update history entry
        print("6. Logging field update...")
        field_update_data = {
            "task_id": task_id,
            "action": "updated",
            "field_name": "priority",
            "old_value": {"value": "high"},
            "new_value": {"value": "critical"},
            "comment": "Priority increased to critical",
        }
        response = await client.post(
            f"{BASE_URL}/task-history/", json=field_update_data, headers=headers
        )
        assert response.status_code == 201
        print(f"✓ Logged field update\n")

        # Step 7: Get all history for task
        print("7. Getting task history...")
        response = await client.get(
            f"{BASE_URL}/task-history/tasks/{task_id}/history", headers=headers
        )
        assert response.status_code == 200
        task_history = response.json()
        print(f"✓ Task has {len(task_history)} history entry(ies)")
        for idx, entry in enumerate(task_history, 1):
            print(f"  {idx}. {entry['action']} - {entry['comment']}")
        print()

        # Step 8: Get history filtered by action
        print("8. Getting history filtered by action='status_changed'...")
        response = await client.get(
            f"{BASE_URL}/task-history/tasks/{task_id}/history?action=status_changed",
            headers=headers,
        )
        assert response.status_code == 200
        filtered_history = response.json()
        print(f"✓ Found {len(filtered_history)} status change(s)")
        for entry in filtered_history:
            print(f"  - {entry['comment']}")
        print()

        # Step 9: Get history filtered by field_name
        print("9. Getting history filtered by field_name='priority'...")
        response = await client.get(
            f"{BASE_URL}/task-history/tasks/{task_id}/history?field_name=priority",
            headers=headers,
        )
        assert response.status_code == 200
        priority_history = response.json()
        print(f"✓ Found {len(priority_history)} priority change(s)\n")

        # Step 10: Get task history summary
        print("10. Getting task history summary...")
        response = await client.get(
            f"{BASE_URL}/task-history/tasks/{task_id}/summary", headers=headers
        )
        assert response.status_code == 200
        summary = response.json()
        print(f"✓ History summary:")
        print(f"  Total changes: {summary['total_changes']}")
        print(f"  Unique users: {summary['unique_users']}")
        print(f"  Actions breakdown:")
        for action, count in summary['actions'].items():
            print(f"    - {action}: {count}")
        print()

        # Step 11: Create another task for user activity testing
        print("11. Creating second task...")
        task2_data = {
            "title": "Review code changes",
            "description": "Check recent commits",
            "priority": "medium",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task2_data, headers=headers)
        assert response.status_code == 201
        task2 = response.json()
        task2_id = task2["id"]
        print(f"✓ Created second task\n")

        # Step 12: Add history to second task
        print("12. Adding history to second task...")
        task2_history_data = {
            "task_id": task2_id,
            "action": "created",
            "comment": "Second task created",
        }
        response = await client.post(
            f"{BASE_URL}/task-history/", json=task2_history_data, headers=headers
        )
        assert response.status_code == 201
        print(f"✓ Added history to second task\n")

        # Step 13: Get current user's activity
        print("13. Getting my activity...")
        response = await client.get(
            f"{BASE_URL}/task-history/users/me/activity", headers=headers
        )
        assert response.status_code == 200
        my_activity = response.json()
        print(f"✓ My activity: {len(my_activity)} action(s)")
        print(f"  Last 3 actions:")
        for entry in my_activity[:3]:
            print(f"    - {entry['action']} on task {entry['task_id']}")
        print()

        # Step 14: Get recent changes across all tasks
        print("14. Getting recent changes...")
        response = await client.get(
            f"{BASE_URL}/task-history/recent?limit=10", headers=headers
        )
        assert response.status_code == 200
        recent_changes = response.json()
        print(f"✓ Recent changes: {len(recent_changes)} entry(ies)")
        for idx, entry in enumerate(recent_changes[:5], 1):
            print(f"  {idx}. {entry['action']} - {entry['comment']}")
        print()

        # Step 15: Create custom action with extra_data
        print("15. Creating custom action with extra_data...")
        custom_data = {
            "task_id": task_id,
            "action": "exported",
            "comment": "Task data exported to PDF",
            "extra_data": {"format": "pdf", "pages": 5, "file_size": "2.3MB"},
        }
        response = await client.post(
            f"{BASE_URL}/task-history/", json=custom_data, headers=headers
        )
        assert response.status_code == 201
        custom_entry = response.json()
        print(f"✓ Created custom action")
        print(f"  Extra data: {custom_entry['extra_data']}\n")

        # Step 16: Delete task history
        print("16. Deleting task history...")
        response = await client.delete(
            f"{BASE_URL}/task-history/tasks/{task2_id}/history", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Deleted history for task 2\n")

        # Verify deletion
        response = await client.get(
            f"{BASE_URL}/task-history/tasks/{task2_id}/history", headers=headers
        )
        remaining_history = response.json()
        print(f"✓ Task 2 now has {len(remaining_history)} history entry(ies)\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
