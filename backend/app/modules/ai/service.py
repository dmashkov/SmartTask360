"""
SmartTask360 — AI Service
"""

import json
from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.modules.ai.client import AIClient, AIError
from app.modules.ai.models import AIConversation, AIMessage
from app.modules.ai.schemas import (
    AIConversationCreate,
    AIConversationUpdate,
    AIMessageCreate,
    SMARTValidationResult,
)


class AIService:
    """Service for managing AI conversations and interactions"""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.client = AIClient()

    # ========================================================================
    # Conversation Management
    # ========================================================================

    async def create_conversation(
        self, conversation_data: AIConversationCreate
    ) -> AIConversation:
        """Create a new AI conversation"""
        conversation = AIConversation(
            conversation_type=conversation_data.conversation_type,
            task_id=conversation_data.task_id,
            user_id=conversation_data.user_id,
            model=conversation_data.model,
            temperature=conversation_data.temperature,
            context=conversation_data.context,
            status="active",
        )

        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def get_conversation_by_id(
        self, conversation_id: UUID
    ) -> AIConversation | None:
        """Get conversation by ID"""
        query = select(AIConversation).where(AIConversation.id == conversation_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none()

    async def get_conversations_by_task(
        self, task_id: UUID, conversation_type: str | None = None
    ) -> list[AIConversation]:
        """Get all conversations for a task"""
        query = select(AIConversation).where(AIConversation.task_id == task_id)

        if conversation_type:
            query = query.where(AIConversation.conversation_type == conversation_type)

        query = query.order_by(AIConversation.created_at.desc())

        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_conversation(
        self, conversation_id: UUID, update_data: AIConversationUpdate
    ) -> AIConversation | None:
        """Update conversation"""
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return None

        if update_data.status is not None:
            conversation.status = update_data.status
            if update_data.status == "completed":
                conversation.completed_at = datetime.utcnow()

        if update_data.result is not None:
            conversation.result = update_data.result

        await self.db.commit()
        await self.db.refresh(conversation)
        return conversation

    async def delete_conversation(self, conversation_id: UUID) -> bool:
        """Delete conversation (will cascade delete messages)"""
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            return False

        await self.db.delete(conversation)
        await self.db.commit()
        return True

    # ========================================================================
    # Message Management
    # ========================================================================

    async def add_message(
        self, conversation_id: UUID, message_data: AIMessageCreate
    ) -> AIMessage:
        """Add a message to conversation"""
        message = AIMessage(
            conversation_id=conversation_id,
            role=message_data.role,
            content=message_data.content,
            sequence=message_data.sequence,
            token_count=message_data.token_count,
            model_used=message_data.model_used,
        )

        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message

    async def get_conversation_messages(
        self, conversation_id: UUID
    ) -> list[AIMessage]:
        """Get all messages in a conversation"""
        query = (
            select(AIMessage)
            .where(AIMessage.conversation_id == conversation_id)
            .order_by(AIMessage.sequence)
        )

        result = await self.db.execute(query)
        return list(result.scalars().all())

    # ========================================================================
    # AI Interactions
    # ========================================================================

    async def send_message_to_ai(
        self, conversation_id: UUID, user_message: str
    ) -> tuple[AIMessage, AIMessage]:
        """
        Send user message to AI and get response.

        For task_dialog conversations, preserves task context with system prompt.

        Returns:
            Tuple of (user_message, ai_message)
        """
        # Get conversation
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        if conversation.status != "active":
            raise ValueError(
                f"Conversation is {conversation.status}, cannot send messages"
            )

        # Get existing messages to build context
        existing_messages = await self.get_conversation_messages(conversation_id)
        next_sequence = len(existing_messages)

        # Build message history for API
        api_messages = [
            {"role": msg.role, "content": msg.content}
            for msg in existing_messages
            if msg.role in ["user", "assistant"]
        ]

        # Add new user message
        api_messages.append({"role": "user", "content": user_message})

        # Build system prompt for task_dialog conversations
        system_prompt = None
        if conversation.conversation_type == "task_dialog":
            from app.modules.ai.prompts import build_task_dialog_prompt

            # Extract task details from context
            context = conversation.context or {}
            system_prompt = build_task_dialog_prompt(
                task_title=context.get("task_title", ""),
                task_description=context.get("task_description", ""),
                conversation_history=[],  # Already in api_messages
                context=context,
            )

        # Call AI API
        try:
            response = await self.client.send_message(
                messages=api_messages,
                model=conversation.model,
                temperature=conversation.temperature,
                system=system_prompt,
            )

            # Save user message
            user_msg = await self.add_message(
                conversation_id,
                AIMessageCreate(
                    role="user",
                    content=user_message,
                    sequence=next_sequence,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            # Save AI response
            ai_msg = await self.add_message(
                conversation_id,
                AIMessageCreate(
                    role="assistant",
                    content=response["content"],
                    sequence=next_sequence + 1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            return user_msg, ai_msg

        except AIError as e:
            # Mark conversation as failed
            await self.update_conversation(
                conversation_id, AIConversationUpdate(status="failed")
            )
            raise e

    async def validate_task_smart(
        self, task_id: UUID, user_id: UUID, task_title: str, task_description: str, context: dict | None = None
    ) -> tuple[AIConversation, SMARTValidationResult]:
        """
        Validate task against SMART criteria.

        Returns:
            Tuple of (conversation, validation_result)
        """
        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="smart_validation",
                task_id=task_id,
                user_id=user_id,
                model="claude-sonnet-4-20250514",
                temperature=0.3,
                context=context,
            )
        )

        try:
            # Call AI validation
            response = await self.client.validate_smart(
                task_title=task_title,
                task_description=task_description or "",
                context=context,
            )

            # Parse JSON response
            try:
                content = response["content"].strip()

                # Remove markdown code blocks if present
                if content.startswith("```json"):
                    content = content[7:]  # Remove ```json
                elif content.startswith("```"):
                    content = content[3:]  # Remove ```

                if content.endswith("```"):
                    content = content[:-3]  # Remove closing ```

                content = content.strip()

                validation_data = json.loads(content)
            except json.JSONDecodeError as e:
                # If not valid JSON, create a basic response
                print(f"JSON parse error: {e}")
                print(f"Content was: {response['content'][:500]}")
                validation_data = {
                    "overall_score": 0.5,
                    "is_valid": False,
                    "criteria": [],
                    "summary": f"Could not parse validation result: {str(e)}",
                    "recommended_changes": [],
                }

            # Create validation result
            validation = SMARTValidationResult(**validation_data)

            # Update conversation with result
            await self.update_conversation(
                conversation.id,
                AIConversationUpdate(
                    status="completed", result=validation.model_dump()
                ),
            )

            # Save SMART score to task
            from app.modules.tasks.service import TaskService

            task_service = TaskService(self.db)
            await task_service.update_smart_score(
                task_id=task_id,
                smart_score=validation.model_dump(),
                is_valid=validation.is_valid,
            )

            # Save messages for audit
            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=f"Validate: {task_title}",
                    sequence=0,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="assistant",
                    content=response["content"],
                    sequence=1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            return conversation, validation

        except Exception as e:
            # Mark as failed
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e

    # ========================================================================
    # AI Task Dialog
    # ========================================================================

    async def start_task_dialog(
        self,
        task_id: UUID,
        user_id: UUID,
        task_title: str,
        task_description: str,
        dialog_type: str = "clarify",
        initial_question: str | None = None,
        context: dict | None = None,
    ) -> tuple[AIConversation, str]:
        """
        Start an interactive task clarification dialog.

        Returns:
            Tuple of (conversation, ai_greeting)
        """
        # Create conversation with task details in context
        full_context = {
            "dialog_type": dialog_type,
            "task_title": task_title,
            "task_description": task_description,
            **(context or {}),
        }

        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="task_dialog",
                task_id=task_id,
                user_id=user_id,
                model="claude-sonnet-4-20250514",
                temperature=0.7,  # Higher temperature for creative dialog
                context=full_context,
            )
        )

        # Build system prompt based on dialog type
        from app.modules.ai.prompts import build_task_dialog_prompt

        system_prompt = build_task_dialog_prompt(
            task_title, task_description, [], context
        )

        # Build initial message
        if dialog_type == "clarify":
            user_prompt = f"""I need help clarifying this task:

Title: {task_title}
Description: {task_description or "No description"}

{initial_question or "Please ask me questions to help make this task more specific and actionable."}"""

        elif dialog_type == "decompose":
            user_prompt = f"""Help me break down this task into smaller subtasks:

Title: {task_title}
Description: {task_description or "No description"}

{initial_question or "Please suggest how to decompose this into manageable pieces."}"""

        elif dialog_type == "estimate":
            user_prompt = f"""Help me estimate effort for this task:

Title: {task_title}
Description: {task_description or "No description"}

{initial_question or "What should I consider when estimating this task?"}"""

        else:  # general
            user_prompt = f"""I want to discuss this task:

Title: {task_title}
Description: {task_description or "No description"}

{initial_question or "How can I improve this task?"}"""

        # Get AI's initial response
        try:
            response = await self.client.send_message(
                messages=[{"role": "user", "content": user_prompt}],
                system=system_prompt,
                model=conversation.model,
                temperature=conversation.temperature,
                max_tokens=1024,
            )

            ai_greeting = response["content"]

            # Save initial messages
            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=user_prompt,
                    sequence=0,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="assistant",
                    content=ai_greeting,
                    sequence=1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            return conversation, ai_greeting

        except Exception as e:
            # Mark as failed
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e

    async def complete_task_dialog(
        self, conversation_id: UUID, apply_changes: bool = True
    ) -> dict:
        """
        Complete task dialog and optionally apply discussed changes.

        Returns summary of changes.
        """
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        # Get all messages to extract insights
        messages = await self.get_conversation_messages(conversation_id)

        # Build summary prompt
        conversation_text = "\n\n".join(
            [f"{msg.role.upper()}: {msg.content}" for msg in messages]
        )

        summary_prompt = f"""Based on this conversation about a task, provide a summary of the key points discussed and any recommendations.

Conversation:
{conversation_text}

Respond ONLY with valid JSON:
{{
  "key_points": ["Point 1", "Point 2", ...],
  "recommendations": ["Recommendation 1", "Recommendation 2", ...],
  "suggested_title": "Improved task title (or null if no change needed)",
  "suggested_description": "Improved task description (or null if no change needed)"
}}"""

        try:
            response = await self.client.send_message(
                messages=[{"role": "user", "content": summary_prompt}],
                model=conversation.model,
                temperature=0.3,  # Low temp for consistent summary
                max_tokens=1536,
            )

            # Parse summary
            content = response["content"].strip()

            # Remove markdown blocks
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            summary_data = json.loads(content.strip())

            # Mark conversation as completed with summary
            await self.update_conversation(
                conversation_id,
                AIConversationUpdate(status="completed", result=summary_data),
            )

            return summary_data

        except Exception as e:
            await self.update_conversation(
                conversation_id, AIConversationUpdate(status="failed")
            )
            raise e

    # ========================================================================
    # AI Risk Analysis
    # ========================================================================

    async def analyze_task_risks(
        self, task_id: UUID, user_id: UUID, task_title: str, task_description: str, context: dict | None = None
    ) -> tuple[AIConversation, dict]:
        """
        Analyze task for potential risks and blockers.

        Returns:
            Tuple of (conversation, risk_analysis_result)
        """
        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="risk_analysis",
                task_id=task_id,
                user_id=user_id,
                model="claude-sonnet-4-20250514",
                temperature=0.4,  # Balanced for risk assessment
                context=context,
            )
        )

        try:
            # Call AI risk analysis
            from app.modules.ai.prompts import build_risk_analysis_prompt

            prompt = build_risk_analysis_prompt(
                task_title=task_title,
                task_description=task_description or "",
                context=context,
            )

            response = await self.client.send_message(
                messages=[{"role": "user", "content": prompt}],
                model=conversation.model,
                temperature=conversation.temperature,
                max_tokens=2048,
            )

            # Parse JSON response
            content = response["content"].strip()

            # Remove markdown blocks
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            try:
                risk_data = json.loads(content.strip())
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Content was: {content[:500]}")
                risk_data = {
                    "overall_risk_level": "Medium",
                    "risks": [],
                    "recommendations": ["Could not parse risk analysis"],
                }

            # Update conversation with result
            await self.update_conversation(
                conversation.id,
                AIConversationUpdate(status="completed", result=risk_data),
            )

            # Save messages for audit
            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=f"Analyze risks: {task_title}",
                    sequence=0,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="assistant",
                    content=response["content"],
                    sequence=1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            return conversation, risk_data

        except Exception as e:
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e

    # ========================================================================
    # AI Comment Generation
    # ========================================================================

    async def generate_ai_comment(
        self,
        task_id: UUID,
        user_id: UUID,
        task_title: str,
        task_description: str,
        comment_type: str = "insight",
        context: dict | None = None,
    ) -> tuple[AIConversation, str]:
        """
        Generate AI comment for task.

        Comment types: insight | risk | progress | blocker | suggestion

        Returns:
            Tuple of (conversation, comment_content)
        """
        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="comment_generation",
                task_id=task_id,
                user_id=user_id,
                model="claude-sonnet-4-20250514",
                temperature=0.5,  # Balanced for helpful comments
                context={**(context or {}), "comment_type": comment_type},
            )
        )

        try:
            # Build comment prompt
            from app.modules.ai.prompts import build_comment_generation_prompt

            prompt = build_comment_generation_prompt(
                task_title=task_title,
                task_description=task_description or "",
                comment_type=comment_type,
                context=context,
            )

            response = await self.client.send_message(
                messages=[{"role": "user", "content": prompt}],
                model=conversation.model,
                temperature=conversation.temperature,
                max_tokens=512,  # Comments should be concise
            )

            comment_content = response["content"].strip()

            # Update conversation
            await self.update_conversation(
                conversation.id,
                AIConversationUpdate(
                    status="completed",
                    result={"comment_type": comment_type, "content": comment_content},
                ),
            )

            # Save messages
            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=f"Generate {comment_type} comment: {task_title}",
                    sequence=0,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="assistant",
                    content=comment_content,
                    sequence=1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            return conversation, comment_content

        except Exception as e:
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e

    # ========================================================================
    # AI Progress Review
    # ========================================================================

    async def review_task_progress(
        self,
        task_id: UUID,
        user_id: UUID,
        task_title: str,
        task_description: str,
        task_status: str,
        subtasks: list[dict] | None = None,
        context: dict | None = None,
    ) -> tuple[AIConversation, dict]:
        """
        Review task progress and provide insights.

        Returns:
            Tuple of (conversation, review_result)
        """
        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="progress_review",
                task_id=task_id,
                user_id=user_id,
                model="claude-sonnet-4-20250514",
                temperature=0.4,
                context=context,
            )
        )

        try:
            # Build progress review prompt
            from app.modules.ai.prompts import build_progress_review_prompt

            prompt = build_progress_review_prompt(
                task_title=task_title,
                task_description=task_description or "",
                task_status=task_status,
                subtasks=subtasks,
                context=context,
            )

            response = await self.client.send_message(
                messages=[{"role": "user", "content": prompt}],
                model=conversation.model,
                temperature=conversation.temperature,
                max_tokens=1536,
            )

            # Parse JSON response
            content = response["content"].strip()

            # Remove markdown blocks
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]

            try:
                review_data = json.loads(content.strip())
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Content was: {content[:500]}")
                review_data = {
                    "progress_status": "unknown",
                    "completion_estimate": "N/A",
                    "summary": "Could not parse progress review",
                    "going_well": [],
                    "concerns": [],
                    "next_steps": [],
                    "risk_level": "Unknown",
                }

            # Update conversation
            await self.update_conversation(
                conversation.id,
                AIConversationUpdate(status="completed", result=review_data),
            )

            # Save messages
            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=f"Review progress: {task_title}",
                    sequence=0,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="assistant",
                    content=response["content"],
                    sequence=1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            return conversation, review_data

        except Exception as e:
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e
