"""
Test Boards API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Boards API ===\n")

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

        # Step 2: Create a task first (needed for board tests)
        print("2. Creating test task...")
        task_data = {
            "title": "Test Task for Board",
            "description": "Task to test board functionality",
            "priority": "medium",
            "status": "new",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201, f"Create task failed: {response.text}"
        task = response.json()
        task_id = task["id"]
        print(f"   Created task: {task['title']} (ID: {task_id})\n")

        # Step 3: Create a board with default columns
        print("3. Creating board with 'basic' template...")
        board_data = {
            "name": "Test Project Board",
            "description": "A board for testing purposes",
            "is_private": False,
        }
        response = await client.post(
            f"{BASE_URL}/boards?template=basic",
            json=board_data,
            headers=headers,
        )
        assert response.status_code == 201, f"Create board failed: {response.text}"
        board = response.json()
        board_id = board["id"]
        print(f"   Created board: {board['name']}")
        print(f"   ID: {board_id}")
        print(f"   Owner: {board['owner_id']}")
        print(f"   Private: {board['is_private']}\n")

        # Step 4: Get board with full details
        print("4. Getting board with full details...")
        response = await client.get(f"{BASE_URL}/boards/{board_id}", headers=headers)
        assert response.status_code == 200, f"Get board failed: {response.text}"
        board_full = response.json()
        print(f"   Board: {board_full['name']}")
        print(f"   Columns ({len(board_full['columns'])}):")
        for col in board_full["columns"]:
            print(f"     - {col['name']} (status: {col['mapped_status']}, WIP: {col['wip_limit']})")
        print(f"   Members ({len(board_full['members'])}):")
        for member in board_full["members"]:
            print(f"     - {member['user_name']} ({member['role']})")
        print()

        # Store column IDs
        columns = board_full["columns"]
        first_column_id = columns[0]["id"]
        second_column_id = columns[1]["id"]
        done_column_id = columns[3]["id"]  # "Готово" column with done status

        # Step 5: List boards
        print("5. Listing accessible boards...")
        response = await client.get(f"{BASE_URL}/boards", headers=headers)
        assert response.status_code == 200, f"List boards failed: {response.text}"
        boards = response.json()
        print(f"   Found {len(boards)} board(s)")
        for b in boards:
            print(f"     - {b['name']} (columns: {b['column_count']}, tasks: {b['task_count']})")
        print()

        # Step 6: Add task to board
        print("6. Adding task to board...")
        add_task_data = {
            "task_id": task_id,
            "column_id": first_column_id,
        }
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/tasks",
            json=add_task_data,
            headers=headers,
        )
        assert response.status_code == 201, f"Add task to board failed: {response.text}"
        board_task = response.json()
        print(f"   Added task to column: {first_column_id}")
        print(f"   Order index: {board_task['order_index']}\n")

        # Step 7: Get updated board
        print("7. Getting updated board...")
        response = await client.get(f"{BASE_URL}/boards/{board_id}", headers=headers)
        assert response.status_code == 200
        board_full = response.json()
        print(f"   Tasks on board: {len(board_full['tasks'])}")
        for t in board_full["tasks"]:
            print(f"     - {t['task_title']} (status: {t['task_status']}, column: {t['column_id']})")
        print()

        # Step 8: Move task to second column
        print("8. Moving task to second column (In Progress)...")
        move_data = {
            "column_id": second_column_id,
        }
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/tasks/{task_id}/move",
            json=move_data,
            headers=headers,
        )
        assert response.status_code == 200, f"Move task failed: {response.text}"
        move_result = response.json()
        print(f"   Move success: {move_result['success']}")
        print(f"   Status changed: {move_result['status_changed']}")
        if move_result['status_changed']:
            print(f"   New status: {move_result['new_status']}")
        print()

        # Step 9: Verify task status changed
        print("9. Verifying task status changed...")
        response = await client.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        assert response.status_code == 200
        updated_task = response.json()
        print(f"   Task status: {updated_task['status']}")
        assert updated_task["status"] == "in_progress", "Status should be in_progress"
        print("   Status correctly synced to 'in_progress'\n")

        # Step 10: Move task to Done column
        print("10. Moving task to 'Done' column...")
        move_data = {
            "column_id": done_column_id,
        }
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/tasks/{task_id}/move",
            json=move_data,
            headers=headers,
        )
        assert response.status_code == 200, f"Move task failed: {response.text}"
        move_result = response.json()
        print(f"    Move success: {move_result['success']}")
        print(f"    Status changed: {move_result['status_changed']}")
        if move_result['new_status']:
            print(f"    New status: {move_result['new_status']}")
        print()

        # Step 11: Verify task completed_at
        print("11. Verifying task completed_at is set...")
        response = await client.get(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        assert response.status_code == 200
        updated_task = response.json()
        print(f"    Task status: {updated_task['status']}")
        print(f"    Completed at: {updated_task['completed_at']}")
        assert updated_task["status"] == "done", "Status should be done"
        assert updated_task["completed_at"] is not None, "completed_at should be set"
        print("    Task correctly marked as completed\n")

        # Step 12: Create a column with WIP limit
        print("12. Creating column with WIP limit of 2...")
        column_data = {
            "name": "Limited Column",
            "wip_limit": 2,
            "color": "#ff5733",
        }
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/columns",
            json=column_data,
            headers=headers,
        )
        assert response.status_code == 201, f"Create column failed: {response.text}"
        limited_column = response.json()
        limited_column_id = limited_column["id"]
        print(f"    Created column: {limited_column['name']}")
        print(f"    WIP Limit: {limited_column['wip_limit']}\n")

        # Step 13: Create more tasks and add to limited column
        print("13. Testing WIP limit...")

        # Create task 2
        task2_data = {"title": "WIP Test Task 2", "priority": "low"}
        response = await client.post(f"{BASE_URL}/tasks/", json=task2_data, headers=headers)
        task2 = response.json()

        # Create task 3
        task3_data = {"title": "WIP Test Task 3", "priority": "low"}
        response = await client.post(f"{BASE_URL}/tasks/", json=task3_data, headers=headers)
        task3 = response.json()

        # Create task 4
        task4_data = {"title": "WIP Test Task 4", "priority": "low"}
        response = await client.post(f"{BASE_URL}/tasks/", json=task4_data, headers=headers)
        task4 = response.json()

        # Add task 2 to limited column (should work)
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/tasks",
            json={"task_id": task2["id"], "column_id": limited_column_id},
            headers=headers,
        )
        assert response.status_code == 201, "First task should be added"
        print("    Added first task to limited column")

        # Add task 3 to limited column (should work - at limit)
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/tasks",
            json={"task_id": task3["id"], "column_id": limited_column_id},
            headers=headers,
        )
        assert response.status_code == 201, "Second task should be added (at limit)"
        print("    Added second task to limited column (at limit)")

        # Try to add task 4 (should fail - over limit)
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/tasks",
            json={"task_id": task4["id"], "column_id": limited_column_id},
            headers=headers,
        )
        assert response.status_code == 400, f"Third task should fail: {response.text}"
        print("    Third task correctly rejected (WIP limit reached)\n")

        # Step 14: Test column reordering
        print("14. Testing column reordering...")
        columns_before = await client.get(
            f"{BASE_URL}/boards/{board_id}/columns", headers=headers
        )
        columns_before = columns_before.json()
        print(f"    Columns before: {[c['name'] for c in columns_before]}")

        # Reverse order
        column_ids = [c["id"] for c in reversed(columns_before)]
        response = await client.post(
            f"{BASE_URL}/boards/{board_id}/columns/reorder",
            json={"column_ids": column_ids},
            headers=headers,
        )
        assert response.status_code == 200, f"Reorder failed: {response.text}"
        columns_after = response.json()
        print(f"    Columns after:  {[c['name'] for c in columns_after]}\n")

        # Step 15: Update column
        print("15. Updating column settings...")
        response = await client.patch(
            f"{BASE_URL}/boards/{board_id}/columns/{limited_column_id}",
            json={"wip_limit": 5, "name": "Updated Column"},
            headers=headers,
        )
        assert response.status_code == 200, f"Update column failed: {response.text}"
        updated_col = response.json()
        print(f"    New name: {updated_col['name']}")
        print(f"    New WIP limit: {updated_col['wip_limit']}\n")

        # Step 16: Create second user and test permissions
        print("16. Creating second user for permission tests...")
        user_data = {
            "email": "board_test_user@example.com",
            "password": "Test123!",
            "name": "Board Test User",
            "role": "executor",
        }
        response = await client.post(f"{BASE_URL}/users/", json=user_data, headers=headers)
        if response.status_code == 201:
            test_user = response.json()
            test_user_id = test_user["id"]
            print(f"    Created user: {test_user['name']} (ID: {test_user_id})")
        else:
            # User might already exist, get their ID
            response = await client.get(f"{BASE_URL}/users/", headers=headers)
            users = response.json()
            test_user = next((u for u in users if u["email"] == "board_test_user@example.com"), None)
            if test_user:
                test_user_id = test_user["id"]
                print(f"    Using existing user: {test_user['name']} (ID: {test_user_id})")
            else:
                print("    Could not create or find test user")
                test_user_id = None

        if test_user_id:
            # Step 17: Add member to board
            print("\n17. Adding member to board...")
            response = await client.post(
                f"{BASE_URL}/boards/{board_id}/members",
                json={"user_id": test_user_id, "role": "member"},
                headers=headers,
            )
            assert response.status_code == 201, f"Add member failed: {response.text}"
            member = response.json()
            print(f"    Added member with role: {member['role']}")

            # Step 18: Update member role
            print("\n18. Updating member role to admin...")
            response = await client.patch(
                f"{BASE_URL}/boards/{board_id}/members/{test_user_id}",
                json={"role": "admin"},
                headers=headers,
            )
            assert response.status_code == 200, f"Update member failed: {response.text}"
            member = response.json()
            print(f"    Updated role: {member['role']}")

            # Step 19: Remove member
            print("\n19. Removing member from board...")
            response = await client.delete(
                f"{BASE_URL}/boards/{board_id}/members/{test_user_id}",
                headers=headers,
            )
            assert response.status_code == 204, f"Remove member failed: {response.text}"
            print("    Member removed successfully")

        # Step 20: Update board
        print("\n20. Updating board settings...")
        response = await client.patch(
            f"{BASE_URL}/boards/{board_id}",
            json={"name": "Updated Test Board", "is_private": True},
            headers=headers,
        )
        assert response.status_code == 200, f"Update board failed: {response.text}"
        updated_board = response.json()
        print(f"    New name: {updated_board['name']}")
        print(f"    Is private: {updated_board['is_private']}")

        # Step 21: Remove task from board
        print("\n21. Removing task from board...")
        response = await client.delete(
            f"{BASE_URL}/boards/{board_id}/tasks/{task_id}",
            headers=headers,
        )
        assert response.status_code == 204, f"Remove task failed: {response.text}"
        print("    Task removed from board")

        # Step 22: Delete a column
        print("\n22. Deleting column...")
        response = await client.delete(
            f"{BASE_URL}/boards/{board_id}/columns/{limited_column_id}",
            headers=headers,
        )
        assert response.status_code == 204, f"Delete column failed: {response.text}"
        print("    Column deleted (tasks moved to first column)")

        # Step 23: Archive board
        print("\n23. Archiving board...")
        response = await client.patch(
            f"{BASE_URL}/boards/{board_id}",
            json={"is_archived": True},
            headers=headers,
        )
        assert response.status_code == 200
        print("    Board archived")

        # Step 24: Verify archived boards are hidden by default
        print("\n24. Verifying archived boards are hidden...")
        response = await client.get(f"{BASE_URL}/boards", headers=headers)
        boards = response.json()
        archived_in_list = any(b["id"] == board_id for b in boards)
        print(f"    Archived board visible: {archived_in_list}")
        assert not archived_in_list, "Archived board should not be in default list"

        # With include_archived=True
        response = await client.get(
            f"{BASE_URL}/boards?include_archived=true", headers=headers
        )
        boards = response.json()
        archived_in_list = any(b["id"] == board_id for b in boards)
        print(f"    With include_archived=true: {archived_in_list}")
        assert archived_in_list, "Archived board should be visible with flag"

        # Step 25: Delete board
        print("\n25. Deleting board...")
        response = await client.delete(
            f"{BASE_URL}/boards/{board_id}",
            headers=headers,
        )
        assert response.status_code == 204, f"Delete board failed: {response.text}"
        print("    Board deleted successfully")

        # Cleanup: delete test tasks
        print("\n26. Cleanup: Deleting test tasks...")
        for t_id in [task_id, task2["id"], task3["id"], task4["id"]]:
            await client.delete(f"{BASE_URL}/tasks/{t_id}", headers=headers)
        print("    Tasks deleted")

        print("\n" + "=" * 50)
        print(" ALL BOARD TESTS PASSED! ")
        print("=" * 50)


if __name__ == "__main__":
    asyncio.run(main())
