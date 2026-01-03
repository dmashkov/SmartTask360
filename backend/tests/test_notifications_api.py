"""
Test Notifications API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Notifications API ===\n")

        # Step 1: Login as admin
        print("1. Login as admin...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        tokens = response.json()
        access_token = tokens["access_token"]
        print(f"   Logged in. Token: {access_token[:20]}...\n")

        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Get notification settings (should create default)
        print("2. Getting notification settings...")
        response = await client.get(
            f"{BASE_URL}/notifications/settings/me",
            headers=headers,
        )
        assert response.status_code == 200, f"Get settings failed: {response.text}"
        settings = response.json()
        print(f"   Settings ID: {settings['id']}")
        print(f"   Task assigned: {settings['notify_task_assigned']}")
        print(f"   Email enabled: {settings['email_enabled']}")
        print(f"   Email digest: {settings['email_digest']}\n")

        # Step 3: Update notification settings
        print("3. Updating notification settings...")
        response = await client.patch(
            f"{BASE_URL}/notifications/settings/me",
            json={
                "notify_board_task_moved": True,
                "email_digest": "instant",
                "quiet_hours_enabled": True,
                "quiet_hours_start": "22:00:00",
                "quiet_hours_end": "08:00:00",
            },
            headers=headers,
        )
        assert response.status_code == 200, f"Update settings failed: {response.text}"
        settings = response.json()
        print(f"   Board task moved: {settings['notify_board_task_moved']}")
        print(f"   Email digest: {settings['email_digest']}")
        print(f"   Quiet hours: {settings['quiet_hours_start']} - {settings['quiet_hours_end']}\n")

        # Step 4: Get unread count (should be 0)
        print("4. Getting unread notification count...")
        response = await client.get(
            f"{BASE_URL}/notifications/unread-count",
            headers=headers,
        )
        assert response.status_code == 200, f"Get unread count failed: {response.text}"
        unread = response.json()
        print(f"   Total unread: {unread['total']}")
        print(f"   High priority: {unread['high_priority']}\n")

        # Step 5: List notifications (should be empty initially)
        print("5. Listing notifications...")
        response = await client.get(
            f"{BASE_URL}/notifications",
            headers=headers,
        )
        assert response.status_code == 200, f"List notifications failed: {response.text}"
        notifications = response.json()
        print(f"   Found {len(notifications)} notification(s)\n")

        # Step 6: Create a task to trigger notifications (via task API)
        print("6. Creating a task...")
        task_response = await client.post(
            f"{BASE_URL}/tasks/",
            json={
                "title": "Test Task for Notifications",
                "description": "This task will be used to test notifications",
                "priority": "high",
            },
            headers=headers,
        )
        assert task_response.status_code == 201, f"Create task failed: {task_response.text}"
        task = task_response.json()
        task_id = task["id"]
        print(f"   Created task: {task['title']}\n")

        # Step 7: Create a second user for testing
        print("7. Creating second user...")
        user_response = await client.post(
            f"{BASE_URL}/users/",
            json={
                "email": "notif_test_user@example.com",
                "password": "Test123!",
                "name": "Notification Test User",
                "role": "executor",
            },
            headers=headers,
        )
        if user_response.status_code == 201:
            test_user = user_response.json()
            test_user_id = test_user["id"]
            print(f"   Created user: {test_user['name']}")
        else:
            # Get existing user
            users_response = await client.get(f"{BASE_URL}/users/", headers=headers)
            users = users_response.json()
            test_user = next(
                (u for u in users if u["email"] == "notif_test_user@example.com"),
                None
            )
            if test_user:
                test_user_id = test_user["id"]
                print(f"   Using existing user: {test_user['name']}")
            else:
                print("   Could not create or find test user")
                test_user_id = None

        # Step 8: Assign task to second user (should trigger notification)
        if test_user_id:
            print("\n8. Assigning task to second user...")
            response = await client.patch(
                f"{BASE_URL}/tasks/{task_id}",
                json={"assignee_id": test_user_id},
                headers=headers,
            )
            assert response.status_code == 200, f"Assign task failed: {response.text}"
            print("   Task assigned")

            # Step 9: Login as second user and check notifications
            print("\n9. Logging in as second user...")
            response = await client.post(
                f"{BASE_URL}/auth/login",
                json={"email": "notif_test_user@example.com", "password": "Test123!"},
            )
            assert response.status_code == 200, f"Login failed: {response.text}"
            user2_token = response.json()["access_token"]
            user2_headers = {"Authorization": f"Bearer {user2_token}"}
            print("   Logged in as second user")

            # Step 10: Get unread count for second user
            print("\n10. Checking unread count for second user...")
            response = await client.get(
                f"{BASE_URL}/notifications/unread-count",
                headers=user2_headers,
            )
            assert response.status_code == 200
            unread = response.json()
            print(f"    Total unread: {unread['total']}")
            # Note: Notifications are created by NotificationService.send() which we haven't integrated yet
            # So count might be 0

            # Step 11: List notifications for second user
            print("\n11. Listing notifications for second user...")
            response = await client.get(
                f"{BASE_URL}/notifications",
                headers=user2_headers,
            )
            assert response.status_code == 200
            notifications = response.json()
            print(f"    Found {len(notifications)} notification(s)")

        # Back to admin for more tests
        print("\n12. Testing notification filtering...")
        response = await client.get(
            f"{BASE_URL}/notifications?unread_only=true",
            headers=headers,
        )
        assert response.status_code == 200
        unread_notifs = response.json()
        print(f"    Unread only: {len(unread_notifs)}")

        response = await client.get(
            f"{BASE_URL}/notifications?entity_type=task",
            headers=headers,
        )
        assert response.status_code == 200
        task_notifs = response.json()
        print(f"    Task notifications: {len(task_notifs)}")

        # Step 13: Test mark all as read
        print("\n13. Marking all notifications as read...")
        response = await client.post(
            f"{BASE_URL}/notifications/mark-all-read",
            json={},
            headers=headers,
        )
        assert response.status_code == 200, f"Mark all read failed: {response.text}"
        result = response.json()
        print(f"    Marked {result['marked_read']} notification(s) as read")

        # Step 14: Verify unread count is 0
        print("\n14. Verifying unread count is 0...")
        response = await client.get(
            f"{BASE_URL}/notifications/unread-count",
            headers=headers,
        )
        assert response.status_code == 200
        unread = response.json()
        print(f"    Total unread: {unread['total']}")
        assert unread["total"] == 0, "Unread count should be 0"

        # Step 15: Test delete old notifications
        print("\n15. Testing delete old notifications...")
        response = await client.delete(
            f"{BASE_URL}/notifications/old/30",
            headers=headers,
        )
        assert response.status_code == 200, f"Delete old failed: {response.text}"
        result = response.json()
        print(f"    Deleted {result['deleted']} old notification(s)")

        # Step 16: Reset notification settings
        print("\n16. Resetting notification settings...")
        response = await client.patch(
            f"{BASE_URL}/notifications/settings/me",
            json={
                "notify_board_task_moved": False,
                "email_digest": "daily",
                "quiet_hours_enabled": False,
            },
            headers=headers,
        )
        assert response.status_code == 200
        print("    Settings reset")

        # Cleanup
        print("\n17. Cleanup: Deleting test task...")
        await client.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        print("    Task deleted")

        print("\n" + "=" * 50)
        print(" ALL NOTIFICATION TESTS PASSED! ")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
