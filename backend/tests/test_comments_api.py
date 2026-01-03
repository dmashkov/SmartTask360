"""
Test Comments API endpoints
"""

import asyncio

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"


async def main():
    async with httpx.AsyncClient(timeout=10.0) as client:
        print("=== Testing Comments API ===\n")

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

        # Step 2: Create a task for testing comments
        print("2. Creating a task...")
        task_data = {
            "title": "Implement commenting system",
            "description": "Add ability to comment on tasks",
            "priority": "medium",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Created task: {task['title']}\n")

        # Step 3: Create first comment
        print("3. Creating first comment...")
        comment1_data = {"task_id": task_id, "content": "This is a great idea!"}
        response = await client.post(
            f"{BASE_URL}/comments/", json=comment1_data, headers=headers
        )
        assert response.status_code == 201
        comment1 = response.json()
        comment1_id = comment1["id"]
        print(f"✓ Created comment: {comment1['content']}")
        print(f"  Author type: {comment1['author_type']}\n")

        # Step 4: Create second comment
        print("4. Creating second comment...")
        comment2_data = {
            "task_id": task_id,
            "content": "We should prioritize this feature for the next sprint.",
        }
        response = await client.post(
            f"{BASE_URL}/comments/", json=comment2_data, headers=headers
        )
        assert response.status_code == 201
        comment2 = response.json()
        comment2_id = comment2["id"]
        print(f"✓ Created comment: {comment2['content']}\n")

        # Step 5: Create reply to first comment (threaded)
        print("5. Creating reply to first comment...")
        reply_data = {
            "task_id": task_id,
            "content": "I agree! Let's start with the basic implementation.",
            "reply_to_id": comment1_id,
        }
        response = await client.post(f"{BASE_URL}/comments/", json=reply_data, headers=headers)
        assert response.status_code == 201
        reply = response.json()
        reply_id = reply["id"]
        print(f"✓ Created reply: {reply['content']}")
        print(f"  Reply to: {reply['reply_to_id']}\n")

        # Step 6: Get all comments for task
        print("6. Getting all comments for task...")
        response = await client.get(
            f"{BASE_URL}/comments/tasks/{task_id}/comments", headers=headers
        )
        assert response.status_code == 200
        task_comments = response.json()
        print(f"✓ Task has {len(task_comments)} comment(s)")
        for idx, comment in enumerate(task_comments, 1):
            print(f"  {idx}. {comment['content'][:50]}...")
        print()

        # Step 7: Get replies to a comment
        print("7. Getting replies to first comment...")
        response = await client.get(
            f"{BASE_URL}/comments/{comment1_id}/replies", headers=headers
        )
        assert response.status_code == 200
        replies = response.json()
        print(f"✓ First comment has {len(replies)} reply(ies)")
        for reply in replies:
            print(f"  - {reply['content'][:50]}...")
        print()

        # Step 8: Get comment by ID
        print("8. Getting comment by ID...")
        response = await client.get(f"{BASE_URL}/comments/{comment1_id}", headers=headers)
        assert response.status_code == 200
        comment = response.json()
        print(f"✓ Retrieved comment: {comment['content']}\n")

        # Step 9: Update comment
        print("9. Updating comment...")
        update_data = {"content": "This is an EXCELLENT idea! Can't wait to use it."}
        response = await client.patch(
            f"{BASE_URL}/comments/{comment1_id}", json=update_data, headers=headers
        )
        assert response.status_code == 200
        updated_comment = response.json()
        print(f"✓ Updated comment: {updated_comment['content']}\n")

        # Step 10: Get my comments
        print("10. Getting my comments...")
        response = await client.get(f"{BASE_URL}/comments/users/me/comments", headers=headers)
        assert response.status_code == 200
        my_comments = response.json()
        print(f"✓ I have {len(my_comments)} comment(s)\n")

        # Step 11: Delete a comment
        print("11. Deleting a comment...")
        response = await client.delete(f"{BASE_URL}/comments/{reply_id}", headers=headers)
        assert response.status_code == 204
        print(f"✓ Comment deleted\n")

        # Verify deletion
        response = await client.get(
            f"{BASE_URL}/comments/tasks/{task_id}/comments", headers=headers
        )
        remaining_comments = response.json()
        print(f"✓ Task now has {len(remaining_comments)} comment(s)\n")

        # Step 12: Test invalid reply_to_id
        print("12. Testing invalid reply_to_id...")
        invalid_reply_data = {
            "task_id": task_id,
            "content": "Reply to non-existent comment",
            "reply_to_id": "00000000-0000-0000-0000-000000000000",
        }
        response = await client.post(
            f"{BASE_URL}/comments/", json=invalid_reply_data, headers=headers
        )
        assert response.status_code == 400
        print(f"✓ Correctly rejected invalid reply_to_id\n")

        print("=== All Tests Passed! ===")


if __name__ == "__main__":
    asyncio.run(main())
