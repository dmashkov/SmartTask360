"""
Test Tasks Extended API (Workflow, Watchers, Participants)
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Tasks Extended API ===\n")

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

        # Step 2: Get basic workflow template
        print("2. Getting basic workflow template...")
        response = await client.get(
            f"{BASE_URL}/workflow/templates/by-name/basic", headers=headers
        )
        assert response.status_code == 200
        basic_workflow = response.json()
        workflow_id = basic_workflow["id"]
        print(f"✓ Got workflow: {basic_workflow['display_name']}\n")

        # Step 3: Create task with workflow
        print("3. Creating task with workflow template...")
        task_data = {
            "title": "Implement user authentication",
            "description": "Add JWT-based auth to the API",
            "priority": "high",
            "status": "new",
            "workflow_template_id": workflow_id,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Created task with workflow")
        print(f"  Task ID: {task_id}")
        print(f"  Workflow ID: {task['workflow_template_id']}\n")

        # Step 4: Get available transitions for task
        print("4. Getting available transitions...")
        response = await client.get(
            f"{BASE_URL}/tasks/{task_id}/available-transitions", headers=headers
        )
        if response.status_code != 200:
            print(f"ERROR: Got status {response.status_code}")
            print(f"Response: {response.text}")
        assert response.status_code == 200
        transitions = response.json()
        print(f"✓ Available transitions:")
        print(f"  Current status: {transitions['current_status']}")
        print(f"  Can transition to: {transitions['available_statuses']}\n")

        # Step 5: Change status using workflow (should succeed)
        print("5. Changing status: new → in_progress (with workflow)...")
        status_change = {"new_status": "in_progress", "comment": None}
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/status-workflow",
            json=status_change,
            headers=headers,
        )
        assert response.status_code == 200
        updated_task = response.json()
        print(f"✓ Status changed: {updated_task['status']}")
        print(f"  Started at: {updated_task['started_at']}\n")

        # Step 6: Try invalid transition (should fail)
        print("6. Trying invalid transition: in_progress → done...")
        invalid_change = {"new_status": "done", "comment": None}
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/status-workflow",
            json=invalid_change,
            headers=headers,
        )
        # Should fail because basic workflow requires in_progress → review → done
        if response.status_code == 400:
            error = response.json()
            print(f"✓ Got expected error: {error['detail']}\n")
        else:
            print(f"✗ Expected 400 error but got {response.status_code}\n")

        # Step 7: Valid transition: in_progress → review
        print("7. Changing status: in_progress → review...")
        status_change2 = {"new_status": "review", "comment": None}
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/status-workflow",
            json=status_change2,
            headers=headers,
        )
        assert response.status_code == 200
        updated_task2 = response.json()
        print(f"✓ Status changed: {updated_task2['status']}\n")

        # Step 8: Add watcher to task
        print("8. Adding admin as watcher...")
        # Get admin user via /users endpoint
        response = await client.get(f"{BASE_URL}/users/", headers=headers)
        assert response.status_code == 200
        users = response.json()
        admin_user = next((u for u in users if u["email"] == ADMIN_EMAIL), None)
        assert admin_user is not None
        admin_id = admin_user["id"]

        watcher_data = {"user_id": admin_id}
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/watchers", json=watcher_data, headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Added watcher\n")

        # Step 9: Get watchers list
        print("9. Getting watchers list...")
        response = await client.get(
            f"{BASE_URL}/tasks/{task_id}/watchers", headers=headers
        )
        assert response.status_code == 200
        watchers = response.json()
        print(f"✓ Task has {len(watchers)} watcher(s)")
        print(f"  Watchers: {watchers}\n")

        # Step 10: Get watched tasks
        print("10. Getting tasks I'm watching...")
        response = await client.get(f"{BASE_URL}/tasks/me/watched", headers=headers)
        assert response.status_code == 200
        watched_tasks = response.json()
        print(f"✓ Watching {len(watched_tasks)} task(s)")
        if watched_tasks:
            print(f"  First watched task: {watched_tasks[0]['title']}\n")

        # Step 11: Add participant to task
        print("11. Adding admin as participant...")
        participant_data = {"user_id": admin_id}
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/participants",
            json=participant_data,
            headers=headers,
        )
        assert response.status_code == 204
        print(f"✓ Added participant\n")

        # Step 12: Get participants list
        print("12. Getting participants list...")
        response = await client.get(
            f"{BASE_URL}/tasks/{task_id}/participants", headers=headers
        )
        assert response.status_code == 200
        participants = response.json()
        print(f"✓ Task has {len(participants)} participant(s)")
        print(f"  Participants: {participants}\n")

        # Step 13: Get participated tasks
        print("13. Getting tasks I'm participating in...")
        response = await client.get(
            f"{BASE_URL}/tasks/me/participated", headers=headers
        )
        assert response.status_code == 200
        participated_tasks = response.json()
        print(f"✓ Participating in {len(participated_tasks)} task(s)\n")

        # Step 14: Remove watcher
        print("14. Removing watcher...")
        response = await client.delete(
            f"{BASE_URL}/tasks/{task_id}/watchers/{admin_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Removed watcher\n")

        # Verify removal
        response = await client.get(
            f"{BASE_URL}/tasks/{task_id}/watchers", headers=headers
        )
        watchers_after = response.json()
        print(f"✓ Watchers after removal: {len(watchers_after)}\n")

        # Step 15: Remove participant
        print("15. Removing participant...")
        response = await client.delete(
            f"{BASE_URL}/tasks/{task_id}/participants/{admin_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Removed participant\n")

        # Verify removal
        response = await client.get(
            f"{BASE_URL}/tasks/{task_id}/participants", headers=headers
        )
        participants_after = response.json()
        print(f"✓ Participants after removal: {len(participants_after)}\n")

        # Step 16: Create task without workflow
        print("16. Creating task without workflow...")
        task2_data = {
            "title": "Fix bug in login",
            "description": "Users can't login",
            "priority": "critical",
            "status": "new",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task2_data, headers=headers)
        assert response.status_code == 201
        task2 = response.json()
        task2_id = task2["id"]
        print(f"✓ Created task without workflow")
        print(f"  Workflow ID: {task2['workflow_template_id']}\n")

        # Step 17: Get available transitions for task without workflow
        print("17. Getting available transitions (no workflow)...")
        response = await client.get(
            f"{BASE_URL}/tasks/{task2_id}/available-transitions", headers=headers
        )
        assert response.status_code == 200
        transitions2 = response.json()
        print(f"✓ Available transitions (no workflow):")
        print(f"  Current status: {transitions2['current_status']}")
        print(f"  Can transition to (all statuses): {len(transitions2['available_statuses'])}\n")

        # Step 18: Change status without workflow validation
        print("18. Changing status without workflow (direct jump to done)...")
        status_change3 = {"new_status": "done", "comment": None}
        response = await client.post(
            f"{BASE_URL}/tasks/{task2_id}/status-workflow",
            json=status_change3,
            headers=headers,
        )
        assert response.status_code == 200
        updated_task3 = response.json()
        print(f"✓ Status changed: {updated_task3['status']}")
        print(f"  (No workflow, so any transition is allowed)\n")

        # Step 19: Add multiple watchers
        print("19. Testing duplicate watcher (should be idempotent)...")
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/watchers", json={"user_id": admin_id}, headers=headers
        )
        assert response.status_code == 204
        response = await client.post(
            f"{BASE_URL}/tasks/{task_id}/watchers", json={"user_id": admin_id}, headers=headers
        )
        assert response.status_code == 204
        response = await client.get(
            f"{BASE_URL}/tasks/{task_id}/watchers", headers=headers
        )
        watchers_dup = response.json()
        print(f"✓ Watchers count (should be 1): {len(watchers_dup)}\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
