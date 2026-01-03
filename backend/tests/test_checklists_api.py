"""
Test Checklists API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Checklists API ===\n")

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

        # Step 2: Create a task for testing checklists
        print("2. Creating a task...")
        task_data = {
            "title": "Launch new feature",
            "description": "Complete all steps before launch",
            "priority": "high",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Created task: {task['title']}\n")

        # Step 3: Create first checklist
        print("3. Creating 'Pre-launch' checklist...")
        checklist1_data = {
            "task_id": task_id,
            "title": "Pre-launch checks",
            "position": 0,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/", json=checklist1_data, headers=headers
        )
        assert response.status_code == 201
        checklist1 = response.json()
        checklist1_id = checklist1["id"]
        print(f"✓ Created checklist: {checklist1['title']}\n")

        # Step 4: Create second checklist
        print("4. Creating 'Post-launch' checklist...")
        checklist2_data = {
            "task_id": task_id,
            "title": "Post-launch tasks",
            "position": 1,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/", json=checklist2_data, headers=headers
        )
        assert response.status_code == 201
        checklist2 = response.json()
        checklist2_id = checklist2["id"]
        print(f"✓ Created checklist: {checklist2['title']}\n")

        # Step 5: Get all checklists for task
        print("5. Getting all checklists for task...")
        response = await client.get(
            f"{BASE_URL}/checklists/tasks/{task_id}/checklists", headers=headers
        )
        assert response.status_code == 200
        task_checklists = response.json()
        print(f"✓ Task has {len(task_checklists)} checklist(s)")
        for idx, cl in enumerate(task_checklists, 1):
            print(f"  {idx}. {cl['title']}")
        print()

        # Step 6: Create root-level item
        print("6. Creating root-level item in checklist 1...")
        item1_data = {
            "checklist_id": checklist1_id,
            "content": "Code review",
            "position": 0,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/items", json=item1_data, headers=headers
        )
        assert response.status_code == 201
        item1 = response.json()
        item1_id = item1["id"]
        print(f"✓ Created item: {item1['content']}")
        print(f"  Path: {item1['path']}, Depth: {item1['depth']}\n")

        # Step 7: Create another root-level item
        print("7. Creating another root-level item...")
        item2_data = {
            "checklist_id": checklist1_id,
            "content": "Testing",
            "position": 1,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/items", json=item2_data, headers=headers
        )
        assert response.status_code == 201
        item2 = response.json()
        item2_id = item2["id"]
        print(f"✓ Created item: {item2['content']}\n")

        # Step 8: Create nested item (child of item 1)
        print("8. Creating nested item under 'Code review'...")
        nested_item_data = {
            "checklist_id": checklist1_id,
            "parent_id": item1_id,
            "content": "Check for security vulnerabilities",
            "position": 0,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/items", json=nested_item_data, headers=headers
        )
        assert response.status_code == 201
        nested_item = response.json()
        nested_item_id = nested_item["id"]
        print(f"✓ Created nested item: {nested_item['content']}")
        print(f"  Path: {nested_item['path']}, Depth: {nested_item['depth']}\n")

        # Step 9: Create deeply nested item (grandchild)
        print("9. Creating deeply nested item...")
        deep_nested_data = {
            "checklist_id": checklist1_id,
            "parent_id": nested_item_id,
            "content": "Run OWASP ZAP scan",
            "position": 0,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/items", json=deep_nested_data, headers=headers
        )
        assert response.status_code == 201
        deep_nested_item = response.json()
        print(f"✓ Created deep nested item: {deep_nested_item['content']}")
        print(f"  Path: {deep_nested_item['path']}, Depth: {deep_nested_item['depth']}\n")

        # Step 10: Get all items for checklist (hierarchical)
        print("10. Getting all items for checklist (hierarchical)...")
        response = await client.get(
            f"{BASE_URL}/checklists/{checklist1_id}/items", headers=headers
        )
        assert response.status_code == 200
        items = response.json()
        print(f"✓ Checklist has {len(items)} item(s)")
        for item in items:
            indent = "  " * item["depth"]
            status = "✓" if item["is_completed"] else "☐"
            print(f"  {indent}{status} {item['content']} (depth: {item['depth']})")
        print()

        # Step 11: Get children of an item
        print("11. Getting children of 'Code review' item...")
        response = await client.get(
            f"{BASE_URL}/checklists/items/{item1_id}/children", headers=headers
        )
        assert response.status_code == 200
        children = response.json()
        print(f"✓ Item has {len(children)} direct child(ren)")
        for child in children:
            print(f"  - {child['content']}")
        print()

        # Step 12: Toggle item completion
        print("12. Completing 'Testing' item...")
        response = await client.post(
            f"{BASE_URL}/checklists/items/{item2_id}/toggle",
            json={"is_completed": True},
            headers=headers,
        )
        assert response.status_code == 200
        completed_item = response.json()
        assert completed_item["is_completed"] is True
        assert completed_item["completed_at"] is not None
        print(f"✓ Item marked as completed\n")

        # Step 13: Get checklist with all items
        print("13. Getting checklist with all items...")
        response = await client.get(
            f"{BASE_URL}/checklists/{checklist1_id}/with-items", headers=headers
        )
        assert response.status_code == 200
        checklist_full = response.json()
        print(f"✓ Retrieved checklist: {checklist_full['title']}")
        print(f"  Total items: {len(checklist_full['items'])}\n")

        # Step 14: Get checklist statistics
        print("14. Getting checklist statistics...")
        response = await client.get(
            f"{BASE_URL}/checklists/{checklist1_id}/stats", headers=headers
        )
        assert response.status_code == 200
        stats = response.json()
        print(f"✓ Statistics:")
        print(f"  Total items: {stats['total_items']}")
        print(f"  Completed: {stats['completed_items']}")
        print(f"  Completion: {stats['completion_percentage']}%\n")

        # Step 15: Update item content
        print("15. Updating item content...")
        update_data = {"content": "Comprehensive code review", "position": 0}
        response = await client.patch(
            f"{BASE_URL}/checklists/items/{item1_id}", json=update_data, headers=headers
        )
        assert response.status_code == 200
        updated_item = response.json()
        print(f"✓ Updated item: {updated_item['content']}\n")

        # Step 16: Move item to different parent
        print("16. Moving nested item to root level...")
        response = await client.post(
            f"{BASE_URL}/checklists/items/{nested_item_id}/move",
            json={"new_parent_id": None, "new_position": 2},
            headers=headers,
        )
        assert response.status_code == 200
        moved_item = response.json()
        print(f"✓ Moved item: {moved_item['content']}")
        print(f"  New path: {moved_item['path']}, New depth: {moved_item['depth']}\n")

        # Step 17: Update checklist
        print("17. Updating checklist title...")
        checklist_update = {"title": "Pre-launch verification", "position": 0}
        response = await client.patch(
            f"{BASE_URL}/checklists/{checklist1_id}",
            json=checklist_update,
            headers=headers,
        )
        assert response.status_code == 200
        updated_checklist = response.json()
        print(f"✓ Updated checklist: {updated_checklist['title']}\n")

        # Step 18: Delete an item
        print("18. Deleting an item...")
        response = await client.delete(
            f"{BASE_URL}/checklists/items/{item2_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Item deleted\n")

        # Verify deletion
        response = await client.get(
            f"{BASE_URL}/checklists/{checklist1_id}/items", headers=headers
        )
        remaining_items = response.json()
        print(f"✓ Checklist now has {len(remaining_items)} item(s)\n")

        # Step 19: Test invalid parent_id
        print("19. Testing invalid parent_id...")
        invalid_item_data = {
            "checklist_id": checklist1_id,
            "parent_id": "00000000-0000-0000-0000-000000000000",
            "content": "Invalid item",
            "position": 0,
        }
        response = await client.post(
            f"{BASE_URL}/checklists/items", json=invalid_item_data, headers=headers
        )
        assert response.status_code == 400
        print(f"✓ Correctly rejected invalid parent_id\n")

        # Step 20: Delete checklist (cascade deletes items)
        print("20. Deleting checklist (cascade deletes items)...")
        response = await client.delete(
            f"{BASE_URL}/checklists/{checklist2_id}", headers=headers
        )
        assert response.status_code == 204
        print(f"✓ Checklist deleted\n")

        # Verify deletion
        response = await client.get(
            f"{BASE_URL}/checklists/tasks/{task_id}/checklists", headers=headers
        )
        remaining_checklists = response.json()
        print(f"✓ Task now has {len(remaining_checklists)} checklist(s)\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
