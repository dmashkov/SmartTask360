"""
Test AI Comments, Risk Analysis, and Progress Review

Tests for AI-powered comment generation, risk analysis, and progress reviews.
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
        print("=== Testing AI Comments & Analysis ===\n")

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

        # Step 2: Create test task
        print("2. Creating test task...")
        task_data = {
            "title": "Implement real-time notifications system",
            "description": "Add WebSocket-based notifications for task updates, comments, and mentions",
            "priority": "high",
            "status": "new",
            "estimated_hours": 40,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=task_data, headers=headers)
        assert response.status_code == 201
        task = response.json()
        task_id = task["id"]
        print(f"✓ Task created: {task_id}\n")

        # Step 3: Analyze task risks
        print("3. Analyzing task risks...")
        response = await client.post(
            f"{BASE_URL}/ai/analyze-risks",
            headers=headers,
            json={
                "task_id": task_id,
                "include_context": True,
            },
        )
        if response.status_code != 200:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
        assert response.status_code == 200
        risk_data = response.json()
        print(f"✓ Risk analysis completed")
        print(f"Overall Risk Level: {risk_data['analysis']['overall_risk_level']}")
        print(f"Risks identified: {len(risk_data['analysis']['risks'])}")
        if risk_data['analysis']['risks']:
            first_risk = risk_data['analysis']['risks'][0]
            print(f"  - {first_risk['category']}: {first_risk['description'][:80]}...")
        print(f"Recommendations: {len(risk_data['analysis']['recommendations'])}\n")

        # Step 4: Generate insight comment
        print("4. Generating insight comment...")
        response = await client.post(
            f"{BASE_URL}/ai/generate-comment",
            headers=headers,
            json={
                "task_id": task_id,
                "comment_type": "insight",
            },
        )
        assert response.status_code == 200
        insight_data = response.json()
        print(f"✓ Insight generated")
        print(f"Comment: {insight_data['comment_content'][:150]}...\n")

        # Step 5: Generate risk comment
        print("5. Generating risk comment...")
        response = await client.post(
            f"{BASE_URL}/ai/generate-comment",
            headers=headers,
            json={
                "task_id": task_id,
                "comment_type": "risk",
            },
        )
        assert response.status_code == 200
        risk_comment_data = response.json()
        print(f"✓ Risk comment generated")
        print(f"Comment: {risk_comment_data['comment_content']}\n")

        # Step 6: Generate blocker comment
        print("6. Generating blocker analysis...")
        response = await client.post(
            f"{BASE_URL}/ai/generate-comment",
            headers=headers,
            json={
                "task_id": task_id,
                "comment_type": "blocker",
            },
        )
        assert response.status_code == 200
        blocker_data = response.json()
        print(f"✓ Blocker analysis generated")
        print(f"Comment: {blocker_data['comment_content']}\n")

        # Step 7: Generate suggestion comment
        print("7. Generating improvement suggestion...")
        response = await client.post(
            f"{BASE_URL}/ai/generate-comment",
            headers=headers,
            json={
                "task_id": task_id,
                "comment_type": "suggestion",
            },
        )
        assert response.status_code == 200
        suggestion_data = response.json()
        print(f"✓ Suggestion generated")
        print(f"Comment: {suggestion_data['comment_content']}\n")

        # Step 8: Create auto-comment (AI-generated comment added to task)
        print("8. Creating auto-comment on task...")
        response = await client.post(
            f"{BASE_URL}/ai/tasks/{task_id}/auto-comment?comment_type=insight",
            headers=headers,
        )
        assert response.status_code == 200
        auto_comment_data = response.json()
        print(f"✓ Auto-comment created")
        print(f"Comment ID: {auto_comment_data['comment']['id']}")
        print(f"AI Type: {auto_comment_data['ai_metadata']['comment_type']}\n")

        # Step 9: Create subtasks for progress review
        print("9. Creating subtasks for progress testing...")
        subtask1_data = {
            "title": "Design WebSocket architecture",
            "description": "Define message protocol and connection management",
            "priority": "high",
            "status": "done",
            "parent_id": task_id,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=subtask1_data, headers=headers)
        assert response.status_code == 201
        subtask1 = response.json()

        subtask2_data = {
            "title": "Implement WebSocket server",
            "description": "Set up Socket.IO or native WebSockets",
            "priority": "high",
            "status": "in_progress",
            "parent_id": task_id,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=subtask2_data, headers=headers)
        assert response.status_code == 201
        subtask2 = response.json()

        subtask3_data = {
            "title": "Add client-side connection handling",
            "description": "Reconnection logic and error handling",
            "priority": "medium",
            "status": "new",
            "parent_id": task_id,
        }
        response = await client.post(f"{BASE_URL}/tasks/", json=subtask3_data, headers=headers)
        assert response.status_code == 201
        subtask3 = response.json()

        print(f"✓ Created 3 subtasks\n")

        # Step 10: Review task progress
        print("10. Reviewing task progress...")
        response = await client.post(
            f"{BASE_URL}/ai/review-progress",
            headers=headers,
            json={
                "task_id": task_id,
                "include_subtasks": True,
            },
        )
        assert response.status_code == 200
        progress_data = response.json()
        review = progress_data["review"]
        print(f"✓ Progress review completed")
        print(f"Progress Status: {review['progress_status']}")
        print(f"Completion Estimate: {review['completion_estimate']}")
        print(f"Summary: {review['summary'][:150]}...")
        print(f"Going Well ({len(review['going_well'])}): {review['going_well']}")
        print(f"Concerns ({len(review['concerns'])}): {review['concerns']}")
        print(f"Next Steps ({len(review['next_steps'])}): {review['next_steps'][:2]}\n")

        # Step 11: Test error - non-existent task
        print("11. Testing error handling - non-existent task...")
        fake_task_id = "00000000-0000-0000-0000-000000000000"
        response = await client.post(
            f"{BASE_URL}/ai/analyze-risks",
            headers=headers,
            json={"task_id": fake_task_id, "include_context": True},
        )
        assert response.status_code == 404
        print("✓ Correctly rejected non-existent task\n")

        # Step 12: Get all AI conversations for task
        print("12. Getting all AI conversations for task...")
        response = await client.get(
            f"{BASE_URL}/ai/tasks/{task_id}/conversations",
            headers=headers,
        )
        assert response.status_code == 200
        all_convs = response.json()
        print(f"✓ Found {len(all_convs)} AI conversations")

        # Count by type
        conv_types = {}
        for conv in all_convs:
            conv_type = conv["conversation_type"]
            conv_types[conv_type] = conv_types.get(conv_type, 0) + 1

        for conv_type, count in conv_types.items():
            print(f"  - {conv_type}: {count}")
        print()

        # Step 13: Get actual comments on task
        print("13. Verifying auto-comment was added to task...")
        response = await client.get(
            f"{BASE_URL}/comments/tasks/{task_id}/comments",
            headers=headers,
        )
        if response.status_code != 200:
            print(f"ERROR: {response.status_code}")
            print(f"Response: {response.text}")
        assert response.status_code == 200
        comments = response.json()
        print(f"✓ Task has {len(comments)} comment(s)")
        if comments:
            ai_comment = comments[0]
            print(f"Comment content: {ai_comment['content'][:100]}...\n")

        print("=== All AI Comment Tests Passed! ===")

        # Print summary
        print("\n=== Test Summary ===")
        print(f"AI Conversations created: {len(all_convs)}")
        print(f"Conversation types:")
        for conv_type, count in conv_types.items():
            print(f"  - {conv_type}: {count}")
        print(f"\nComment types tested: insight, risk, blocker, suggestion")
        print(f"Auto-comment: ✓")
        print(f"Risk analysis: ✓")
        print(f"Progress review: ✓")
        print(f"Error handling: ✓")


if __name__ == "__main__":
    asyncio.run(main())
