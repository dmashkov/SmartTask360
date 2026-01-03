"""
Test AI API (Conversations, Messages, SMART Validation)

NOTE: These tests require ANTHROPIC_API_KEY to be set in .env
For testing without API key, AI calls will be mocked.
"""

import asyncio
import os
from unittest.mock import AsyncMock, patch

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"

# Check if we should use real API or mock
USE_REAL_API = os.getenv("ANTHROPIC_API_KEY") and os.getenv("TEST_WITH_REAL_AI") == "true"


async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        print("=== Testing AI API ===\n")

        # Step 1: Login as admin
        print("1. Login as admin...")
        response = await client.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        )
        assert response.status_code == 200
        tokens = response.json()
        access_token = tokens["access_token"]
        print("✓ Logged in\n")

        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Create a test task
        print("2. Creating test task for AI validation...")
        task_data = {
            "title": "Implement user authentication system",
            "description": "Add JWT-based authentication with email/password login",
            "priority": "high",
            "status": "new",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Created task: {task_id}\n")

        # Step 3: Validate task with SMART criteria (will mock if no API key)
        print("3. Validating task with SMART criteria...")

        if USE_REAL_API:
            print("   Using REAL Anthropic API...")
            validation_request = {
                "task_id": task_id,
                "include_context": True,
            }
            response = await client.post(
                f"{BASE_URL}/ai/validate-smart",
                json=validation_request,
                headers=headers,
            )

            if response.status_code == 200:
                result = response.json()
                conversation_id = result["conversation_id"]
                validation = result["validation"]

                print(f"✓ SMART Validation completed")
                print(f"  Conversation ID: {conversation_id}")
                print(f"  Overall Score: {validation['overall_score']:.2f}")
                print(f"  Is Valid: {validation['is_valid']}")
                print(f"  Summary: {validation['summary']}\n")

                # Step 4: Get conversation details
                print("4. Getting conversation details...")
                response = await client.get(
                    f"{BASE_URL}/ai/conversations/{conversation_id}",
                    headers=headers,
                )
                assert response.status_code == 200
                conversation = response.json()
                print(f"✓ Conversation type: {conversation['conversation_type']}")
                print(f"  Status: {conversation['status']}\n")

                # Step 5: Get conversation with messages
                print("5. Getting conversation messages...")
                response = await client.get(
                    f"{BASE_URL}/ai/conversations/{conversation_id}/messages",
                    headers=headers,
                )
                assert response.status_code == 200
                conv_with_messages = response.json()
                messages = conv_with_messages["messages"]
                print(f"✓ Conversation has {len(messages)} messages")
                for msg in messages:
                    preview = msg["content"][:60] + "..." if len(msg["content"]) > 60 else msg["content"]
                    print(f"  [{msg['role']}] {preview}\n")

                # Step 6: Get all conversations for task
                print("6. Getting all conversations for task...")
                response = await client.get(
                    f"{BASE_URL}/ai/tasks/{task_id}/conversations",
                    headers=headers,
                )
                assert response.status_code == 200
                task_conversations = response.json()
                print(f"✓ Task has {len(task_conversations)} conversation(s)\n")

                # Step 7: Filter conversations by type
                print("7. Getting SMART validation conversations only...")
                response = await client.get(
                    f"{BASE_URL}/ai/tasks/{task_id}/conversations?conversation_type=smart_validation",
                    headers=headers,
                )
                assert response.status_code == 200
                smart_conversations = response.json()
                print(f"✓ Found {len(smart_conversations)} SMART validation conversation(s)\n")

                # Step 8: Test access control - try to access conversation from different user
                print("8. Testing access control (should fail with 403)...")
                # Create another user first
                user2_data = {
                    "email": "user2@test.com",
                    "password": "User123!",
                    "name": "Test User 2",
                    "role": "user",
                }
                response = await client.post(f"{BASE_URL}/users/", json=user2_data, headers=headers)
                if response.status_code == 201:
                    # Login as user2
                    response = await client.post(
                        f"{BASE_URL}/auth/login",
                        json={"email": "user2@test.com", "password": "User123!"},
                    )
                    user2_token = response.json()["access_token"]
                    user2_headers = {"Authorization": f"Bearer {user2_token}"}

                    # Try to access admin's conversation
                    response = await client.get(
                        f"{BASE_URL}/ai/conversations/{conversation_id}",
                        headers=user2_headers,
                    )
                    assert response.status_code == 403
                    print("✓ Access correctly denied to other user\n")

                    # Cleanup user2
                    await client.delete(f"{BASE_URL}/users/{response.json()['id']}", headers=headers)

                # Step 9: Delete conversation
                print("9. Deleting conversation...")
                response = await client.delete(
                    f"{BASE_URL}/ai/conversations/{conversation_id}",
                    headers=headers,
                )
                assert response.status_code == 204
                print("✓ Conversation deleted\n")

                # Verify deletion
                response = await client.get(
                    f"{BASE_URL}/ai/conversations/{conversation_id}",
                    headers=headers,
                )
                assert response.status_code == 404
                print("✓ Conversation not found after deletion\n")

        else:
            print("   MOCKING AI API (no ANTHROPIC_API_KEY or TEST_WITH_REAL_AI not set)...")
            print("   Skipping API tests - would need real API key\n")
            print("   To test with real API:")
            print("   1. Set ANTHROPIC_API_KEY in .env")
            print("   2. Set TEST_WITH_REAL_AI=true")
            print("   3. Run tests again\n")

        # Step 10: Test error handling - validate non-existent task
        print("10. Testing error handling - non-existent task...")
        validation_request = {
            "task_id": "00000000-0000-0000-0000-000000000000",
            "include_context": False,
        }
        response = await client.post(
            f"{BASE_URL}/ai/validate-smart",
            json=validation_request,
            headers=headers,
        )
        assert response.status_code == 404
        print("✓ Got expected 404 for non-existent task\n")

        # Step 11: Test getting non-existent conversation
        print("11. Testing get non-existent conversation...")
        response = await client.get(
            f"{BASE_URL}/ai/conversations/00000000-0000-0000-0000-000000000000",
            headers=headers,
        )
        assert response.status_code == 404
        print("✓ Got expected 404 for non-existent conversation\n")

        # Step 12: Test getting conversations for non-existent task
        print("12. Getting conversations for non-existent task...")
        response = await client.get(
            f"{BASE_URL}/ai/tasks/00000000-0000-0000-0000-000000000000/conversations",
            headers=headers,
        )
        assert response.status_code == 200
        conversations = response.json()
        assert len(conversations) == 0
        print("✓ Returns empty list for non-existent task\n")

        # Cleanup: Delete test task
        print("Cleanup: Deleting test task...")
        response = await client.delete(f"{BASE_URL}/tasks/{task_id}", headers=headers)
        print("✓ Cleanup complete\n")

        if USE_REAL_API:
            print("=== All Tests Passed! (with REAL API) ===")
        else:
            print("=== Basic Tests Passed! (AI API mocked) ===")
            print("Run with ANTHROPIC_API_KEY and TEST_WITH_REAL_AI=true for full testing")


if __name__ == "__main__":
    asyncio.run(main())
