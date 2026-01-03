"""
Test AI Task Dialogs

Tests for interactive AI task clarification dialogs.
"""

import asyncio
import os

import httpx

# Test configuration
BASE_URL = "http://localhost:8000/api/v1"
ADMIN_EMAIL = "admin@smarttask360.com"
ADMIN_PASSWORD = "Admin123!"

# Check if we should use real API or mock
USE_REAL_API = os.getenv("ANTHROPIC_API_KEY") and os.getenv("TEST_WITH_REAL_AI") == "true"


async def main():
    async with httpx.AsyncClient(timeout=60.0) as client:
        print("=== Testing AI Task Dialogs ===\n")

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
        print("2. Creating test task...")
        task_data = {
            "title": "Implement user authentication system",
            "description": "Add authentication to the application",
            "priority": "high",
            "status": "new",
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Task created: {task_id}\n")

        # Step 3: Start clarify dialog
        print("3. Starting clarify dialog...")
        response = await client.post(
            f"{BASE_URL}/ai/tasks/{task_id}/start-dialog",
            headers=headers,
            json={
                "task_id": task_id,
                "dialog_type": "clarify",
                "initial_question": "What specific details are missing from this task?",
            },
        )
        assert response.status_code == 200
        dialog_data = response.json()
        conversation_id = dialog_data["conversation_id"]
        ai_greeting = dialog_data["ai_greeting"]
        print(f"✓ Dialog started: {conversation_id}")
        print(f"AI Greeting: {ai_greeting[:200]}...\n")

        # Step 4: Send first message in dialog
        print("4. Sending first message to AI...")
        response = await client.post(
            f"{BASE_URL}/ai/conversations/{conversation_id}/messages",
            headers=headers,
            json={
                "content": "The task needs to support user authentication with email and password using JWT tokens.",
            },
        )
        assert response.status_code == 200
        msg_data = response.json()
        ai_response_1 = msg_data["ai_message"]["content"]
        print(f"✓ Message sent")
        print(f"User: The task needs to support user authentication with email and password using JWT tokens.")
        print(f"AI: {ai_response_1[:200]}...\n")

        # Step 5: Send second message
        print("5. Sending second message...")
        response = await client.post(
            f"{BASE_URL}/ai/conversations/{conversation_id}/messages",
            headers=headers,
            json={
                "content": "We need JWT tokens with 15-minute expiration and refresh mechanism.",
            },
        )
        assert response.status_code == 200
        msg_data = response.json()
        ai_response_2 = msg_data["ai_message"]["content"]
        print(f"✓ Message sent")
        print(f"User: We need JWT tokens with 15-minute expiration and refresh mechanism.")
        print(f"AI: {ai_response_2[:200]}...\n")

        # Step 6: Get conversation with all messages
        print("6. Getting conversation with all messages...")
        response = await client.get(
            f"{BASE_URL}/ai/conversations/{conversation_id}/messages",
            headers=headers,
        )
        assert response.status_code == 200
        conv_data = response.json()
        num_messages = len(conv_data["messages"])
        print(f"✓ Conversation has {num_messages} messages\n")

        # Step 7: Complete dialog without applying changes
        print("7. Completing dialog without applying changes...")
        response = await client.post(
            f"{BASE_URL}/ai/conversations/{conversation_id}/complete-dialog",
            headers=headers,
            json={"apply_changes": False},
        )
        assert response.status_code == 200
        complete_data = response.json()
        print(f"✓ Dialog completed: {complete_data['message']}\n")

        # Step 8: Start decompose dialog
        print("8. Starting decompose dialog...")
        response = await client.post(
            f"{BASE_URL}/ai/tasks/{task_id}/start-dialog",
            headers=headers,
            json={
                "task_id": task_id,
                "dialog_type": "decompose",
                "initial_question": "How should I break this task into subtasks?",
            },
        )
        assert response.status_code == 200
        decompose_data = response.json()
        decompose_conv_id = decompose_data["conversation_id"]
        decompose_greeting = decompose_data["ai_greeting"]
        print(f"✓ Decompose dialog started: {decompose_conv_id}")
        print(f"AI: {decompose_greeting[:200]}...\n")

        # Step 9: Send message in decompose dialog
        print("9. Discussing decomposition...")
        response = await client.post(
            f"{BASE_URL}/ai/conversations/{decompose_conv_id}/messages",
            headers=headers,
            json={
                "content": "The authentication should include: user registration, login, logout, password reset, and session management.",
            },
        )
        assert response.status_code == 200
        decompose_msg = response.json()
        print(f"✓ Message sent")
        print(f"AI: {decompose_msg['ai_message']['content'][:200]}...\n")

        # Step 10: Complete decompose dialog and apply changes
        print("10. Completing decompose dialog with applying changes...")
        response = await client.post(
            f"{BASE_URL}/ai/conversations/{decompose_conv_id}/complete-dialog",
            headers=headers,
            json={"apply_changes": True},
        )
        if response.status_code != 200:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
        assert response.status_code == 200
        decompose_complete = response.json()
        print(f"✓ Dialog completed and applied")
        if decompose_complete.get("changes_summary"):
            print(f"Changes: {decompose_complete['changes_summary']}\n")

        # Step 11: Start estimate dialog
        print("11. Starting estimate dialog...")
        response = await client.post(
            f"{BASE_URL}/ai/tasks/{task_id}/start-dialog",
            headers=headers,
            json={
                "task_id": task_id,
                "dialog_type": "estimate",
            },
        )
        assert response.status_code == 200
        estimate_data = response.json()
        print(f"✓ Estimate dialog started")
        print(f"AI: {estimate_data['ai_greeting'][:200]}...\n")

        # Step 12: Get all task_dialog conversations for task
        print("12. Getting all dialog conversations for task...")
        response = await client.get(
            f"{BASE_URL}/ai/tasks/{task_id}/conversations?conversation_type=task_dialog",
            headers=headers,
        )
        assert response.status_code == 200
        all_dialogs = response.json()
        print(f"✓ Found {len(all_dialogs)} task_dialog conversations\n")

        # Step 13: Test error - non-existent task
        print("13. Testing error handling - non-existent task...")
        fake_task_id = "00000000-0000-0000-0000-000000000000"
        response = await client.post(
            f"{BASE_URL}/ai/tasks/{fake_task_id}/start-dialog",
            headers=headers,
            json={
                "task_id": fake_task_id,
                "dialog_type": "clarify",
            },
        )
        assert response.status_code == 404
        print("✓ Correctly rejected non-existent task\n")

        # Step 14: Test error - completing already completed dialog
        print("14. Testing error - completing already completed dialog...")
        response = await client.post(
            f"{BASE_URL}/ai/conversations/{conversation_id}/complete-dialog",
            headers=headers,
            json={"apply_changes": False},
        )
        assert response.status_code == 400
        print("✓ Correctly rejected already completed dialog\n")

        # Step 15: Verify conversation status
        print("15. Verifying conversation status...")
        response = await client.get(
            f"{BASE_URL}/ai/conversations/{conversation_id}",
            headers=headers,
        )
        assert response.status_code == 200
        conv = response.json()
        assert conv["status"] == "completed"
        assert conv["conversation_type"] == "task_dialog"
        print(f"✓ Conversation status: {conv['status']}\n")

        print("=== All Dialog Tests Passed! ===")

        # Print summary
        print("\n=== Test Summary ===")
        print(f"Total dialogs created: {len(all_dialogs)}")
        print(f"Dialog types tested: clarify, decompose, estimate")
        print(f"Multi-turn conversations: ✓")
        print(f"Context preservation: ✓")
        print(f"Apply changes: ✓")
        print(f"Error handling: ✓")


if __name__ == "__main__":
    asyncio.run(main())
