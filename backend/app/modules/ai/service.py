"""
SmartTask360 — AI Service
"""

import json
from datetime import datetime
from typing import Any
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
from app.modules.system_settings.service import SystemSettingsService
from app.modules.system_settings.schemas import PromptType


class AIService:
    """Service for managing AI conversations and interactions"""

    def __init__(self, db: AsyncSession):
        from app.modules.tasks.service import TaskService

        self.db = db
        self.client = AIClient()
        self._settings_service = SystemSettingsService(db)
        self.task_service = TaskService(db)

    async def get_ai_model(self) -> str:
        """Get the configured AI model from settings."""
        return await self._settings_service.get_ai_model()

    async def get_ai_language(self) -> str:
        """Get the configured AI response language from settings."""
        return await self._settings_service.get_ai_language()

    async def get_custom_prompt(self, prompt_type: PromptType) -> str | None:
        """Get custom prompt if configured, otherwise return None (will use default)."""
        content, is_custom = await self._settings_service.get_prompt(prompt_type)
        return content if is_custom else None

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

            # Get custom prompt if configured
            custom_prompt = await self.get_custom_prompt(PromptType.TASK_DIALOG)

            # Get configured language
            language = await self.get_ai_language()

            # Extract task details from context
            context = conversation.context or {}
            system_prompt = build_task_dialog_prompt(
                task_title=context.get("task_title", ""),
                task_description=context.get("task_description", ""),
                conversation_history=[],  # Already in api_messages
                context=context,
                custom_prompt=custom_prompt,
                language=language,
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
        # Get configured model
        ai_model = await self.get_ai_model()

        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="smart_validation",
                task_id=task_id,
                user_id=user_id,
                model=ai_model,
                temperature=0.3,
                context=context,
            )
        )

        try:
            # Get custom prompt if configured
            custom_prompt = await self.get_custom_prompt(PromptType.SMART_VALIDATION)

            # Get configured language
            language = await self.get_ai_language()

            # Call AI validation
            response = await self.client.validate_smart(
                task_title=task_title,
                task_description=task_description or "",
                context=context,
                custom_prompt=custom_prompt,
                language=language,
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
        # Get configured model
        ai_model = await self.get_ai_model()

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
                model=ai_model,
                temperature=0.7,  # Higher temperature for creative dialog
                context=full_context,
            )
        )

        # Get custom prompt if configured
        custom_prompt = await self.get_custom_prompt(PromptType.TASK_DIALOG)

        # Get configured language
        language = await self.get_ai_language()

        # Build system prompt based on dialog type
        from app.modules.ai.prompts import build_task_dialog_prompt

        system_prompt = build_task_dialog_prompt(
            task_title, task_description, [], context, custom_prompt=custom_prompt, language=language
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
        # Get configured model
        ai_model = await self.get_ai_model()

        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="risk_analysis",
                task_id=task_id,
                user_id=user_id,
                model=ai_model,
                temperature=0.4,  # Balanced for risk assessment
                context=context,
            )
        )

        try:
            # Get custom prompt if configured
            custom_prompt = await self.get_custom_prompt(PromptType.RISK_ANALYSIS)

            # Get configured language
            language = await self.get_ai_language()

            # Call AI risk analysis
            from app.modules.ai.prompts import build_risk_analysis_prompt

            prompt = build_risk_analysis_prompt(
                task_title=task_title,
                task_description=task_description or "",
                context=context,
                custom_prompt=custom_prompt,
                language=language,
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
        # Get configured model
        ai_model = await self.get_ai_model()

        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="comment_generation",
                task_id=task_id,
                user_id=user_id,
                model=ai_model,
                temperature=0.5,  # Balanced for helpful comments
                context={**(context or {}), "comment_type": comment_type},
            )
        )

        try:
            # Get custom prompt if configured
            custom_prompt = await self.get_custom_prompt(PromptType.COMMENT_GENERATION)

            # Get configured language
            language = await self.get_ai_language()

            # Build comment prompt
            from app.modules.ai.prompts import build_comment_generation_prompt

            prompt = build_comment_generation_prompt(
                task_title=task_title,
                task_description=task_description or "",
                comment_type=comment_type,
                context=context,
                custom_prompt=custom_prompt,
                language=language,
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
        # Get configured model
        ai_model = await self.get_ai_model()

        # Create conversation
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="progress_review",
                task_id=task_id,
                user_id=user_id,
                model=ai_model,
                temperature=0.4,
                context=context,
            )
        )

        try:
            # Get custom prompt if configured
            custom_prompt = await self.get_custom_prompt(PromptType.PROGRESS_REVIEW)

            # Get configured language
            language = await self.get_ai_language()

            # Build progress review prompt
            from app.modules.ai.prompts import build_progress_review_prompt

            prompt = build_progress_review_prompt(
                task_title=task_title,
                task_description=task_description or "",
                task_status=task_status,
                subtasks=subtasks,
                context=context,
                custom_prompt=custom_prompt,
                language=language,
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

    # =========================================================================
    # SMART Wizard Methods
    # =========================================================================

    async def analyze_task_for_smart(
        self,
        task_id: UUID,
        user_id: UUID,
        include_context: bool = True,
    ) -> tuple[Any, dict]:
        """
        Step 1 of SMART Wizard: Analyze task and generate clarifying questions.

        Args:
            task_id: Task to analyze
            user_id: User initiating the analysis
            include_context: Whether to include parent/project context

        Returns:
            Tuple of (AIConversation, analysis_result dict)
        """
        from app.modules.ai.prompts import build_smart_analyze_prompt

        # Get task
        task = await self.task_service.get_by_id(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        task_title = task.title
        task_description = task.description

        # Build context
        context: dict = {
            "priority": task.priority.value if hasattr(task.priority, 'value') else task.priority,
            "status": task.status.value if hasattr(task.status, 'value') else task.status,
        }

        if include_context and task.parent_id:
            parent = await self.task_service.get_by_id(task.parent_id)
            if parent:
                context["parent_task"] = {
                    "title": parent.title,
                    "description": parent.description,
                }

        # Create conversation for wizard flow
        conversation = await self.create_conversation(
            AIConversationCreate(
                conversation_type="smart_wizard",
                task_id=task_id,
                user_id=user_id,
                model=await self.get_ai_model(),
                temperature=0.5,  # Moderate temperature for question generation
                context={
                    "step": "analyze",
                    "task_title": task_title,
                    "task_description": task_description,
                    **context,
                },
            )
        )

        try:
            # Get configured language
            language = await self.get_ai_language()

            # Build prompt
            prompt = build_smart_analyze_prompt(
                task_title=task_title,
                task_description=task_description or "",
                context=context,
                language=language,
            )

            # Call AI
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
                analysis_data = json.loads(content.strip())
            except json.JSONDecodeError as e:
                print(f"JSON parse error in analyze: {e}")
                print(f"Content was: {content[:500]}")
                analysis_data = {
                    "initial_assessment": "Не удалось проанализировать задачу. Попробуйте ещё раз.",
                    "can_skip": False,
                    "questions": [],
                }

            # Store questions in conversation context for refine step
            await self.update_conversation(
                conversation.id,
                AIConversationUpdate(
                    result={
                        "step": "analyze_complete",
                        "questions": analysis_data.get("questions", []),
                        "initial_assessment": analysis_data.get("initial_assessment", ""),
                        "can_skip": analysis_data.get("can_skip", False),
                    }
                ),
            )

            # Save messages
            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=f"Analyze task for SMART: {task_title}",
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

            return conversation, analysis_data

        except Exception as e:
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e

    async def refine_task_smart(
        self,
        conversation_id: UUID,
        answers: list[dict],
        additional_context: str | None = None,
    ) -> tuple[Any, dict]:
        """
        Step 2 of SMART Wizard: Generate SMART proposal based on user answers.

        Args:
            conversation_id: Conversation from analyze step
            answers: User answers to AI questions
            additional_context: Any additional context from user

        Returns:
            Tuple of (AIConversation, proposal dict)
        """
        from app.modules.ai.prompts import build_smart_refine_prompt

        # Get conversation
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        if conversation.conversation_type != "smart_wizard":
            raise ValueError(f"Invalid conversation type for SMART refine: {conversation.conversation_type}")

        # Get stored data from analyze step
        result = conversation.result or {}
        questions = result.get("questions", [])

        # Get task info from context
        context = conversation.context or {}
        task_title = context.get("task_title", "")
        task_description = context.get("task_description", "")

        try:
            # Get configured language
            language = await self.get_ai_language()

            # Build prompt
            prompt = build_smart_refine_prompt(
                task_title=task_title,
                task_description=task_description,
                questions=questions,
                answers=answers,
                context=context,
                additional_context=additional_context,
                language=language,
            )

            # Call AI
            response = await self.client.send_message(
                messages=[{"role": "user", "content": prompt}],
                model=conversation.model,
                temperature=0.5,  # Moderate temperature for structured output
                max_tokens=3000,
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
                proposal_data = json.loads(content.strip())
            except json.JSONDecodeError as e:
                print(f"JSON parse error in refine: {e}")
                print(f"Content was: {content[:500]}")
                proposal_data = {
                    "title": task_title,
                    "description": task_description,
                    "definition_of_done": [],
                    "time_estimate": None,
                    "smart_scores": None,
                }

            # Update conversation with proposal
            await self.update_conversation(
                conversation.id,
                AIConversationUpdate(
                    result={
                        **result,
                        "step": "refine_complete",
                        "answers": answers,
                        "proposal": proposal_data,
                    }
                ),
            )

            # Save messages
            messages = await self.get_conversation_messages(conversation.id)
            message_count = len(messages)

            # Format answers for user message
            answers_text = "\n".join([f"Q{a['question_id']}: {a['value']}" for a in answers])
            if additional_context:
                answers_text += f"\n\nДополнительно: {additional_context}"

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="user",
                    content=f"Answers:\n{answers_text}",
                    sequence=message_count,
                    token_count=response["usage"]["input_tokens"],
                    model_used=conversation.model,
                ),
            )

            await self.add_message(
                conversation.id,
                AIMessageCreate(
                    role="assistant",
                    content=response["content"],
                    sequence=message_count + 1,
                    token_count=response["usage"]["output_tokens"],
                    model_used=response["model"],
                ),
            )

            # Return original task data for comparison
            original_task = {
                "title": task_title,
                "description": task_description,
            }

            return conversation, {"proposal": proposal_data, "original_task": original_task}

        except Exception as e:
            await self.update_conversation(
                conversation.id, AIConversationUpdate(status="failed")
            )
            raise e

    async def apply_smart_proposal(
        self,
        conversation_id: UUID,
        apply_title: bool = True,
        apply_description: bool = True,
        apply_dod: bool = True,
        custom_title: str | None = None,
        custom_description: str | None = None,
        custom_dod: list[str] | None = None,
    ) -> dict:
        """
        Step 3 of SMART Wizard: Apply the proposal to the task.

        Args:
            conversation_id: Conversation with proposal
            apply_title: Whether to apply title change
            apply_description: Whether to apply description change
            apply_dod: Whether to create checklist from DoD
            custom_title: Custom title override
            custom_description: Custom description override
            custom_dod: Custom DoD override

        Returns:
            Result dict with changes applied
        """
        from app.modules.tasks.schemas import TaskUpdate

        # Get conversation
        conversation = await self.get_conversation_by_id(conversation_id)
        if not conversation:
            raise ValueError(f"Conversation {conversation_id} not found")

        result = conversation.result or {}
        proposal = result.get("proposal", {})

        if not proposal:
            raise ValueError("No proposal found in conversation")

        task_id = conversation.task_id
        changes_applied = []

        # Get values to apply (custom overrides or proposal values)
        new_title = custom_title if custom_title else proposal.get("title")
        new_description = custom_description if custom_description else proposal.get("description")
        raw_dod_items = custom_dod if custom_dod else proposal.get("definition_of_done", [])

        # Normalize DoD items to strings (handle objects if AI returned wrong format)
        dod_items = []
        for item in raw_dod_items:
            if isinstance(item, str):
                # Expected format - plain string
                dod_items.append(item)
            elif isinstance(item, dict):
                # AI might return objects like acceptance_criteria format
                # Try to extract meaningful text
                if "description" in item:
                    dod_items.append(str(item["description"]))
                elif "verification" in item:
                    dod_items.append(str(item["verification"]))
                elif "content" in item:
                    dod_items.append(str(item["content"]))
                else:
                    # Fallback: use first string value
                    for v in item.values():
                        if isinstance(v, str) and v.strip():
                            dod_items.append(v)
                            break
            else:
                # Fallback: convert to string
                dod_items.append(str(item))

        # Filter out empty items
        dod_items = [item.strip() for item in dod_items if item and item.strip()]

        print(f"[SMART APPLY] DoD items: {dod_items}")

        # Apply task updates
        update_data = {}
        if apply_title and new_title:
            update_data["title"] = new_title
            changes_applied.append("title")
        if apply_description and new_description:
            update_data["description"] = new_description
            changes_applied.append("description")

        if update_data:
            await self.task_service.update(task_id, TaskUpdate(**update_data))

        # Create checklist from DoD items
        checklist_id = None
        if apply_dod and dod_items:
            from app.modules.checklists.service import ChecklistService
            from app.modules.checklists.schemas import ChecklistCreate, ChecklistItemCreate

            checklist_service = ChecklistService(self.db)

            # Create checklist
            checklist = await checklist_service.create_checklist(
                ChecklistCreate(
                    task_id=task_id,
                    title="Критерии выполнения (DoD)",
                )
            )
            checklist_id = checklist.id
            changes_applied.append("checklist")

            # Add items
            for i, item_text in enumerate(dod_items):
                await checklist_service.create_item(
                    ChecklistItemCreate(
                        checklist_id=checklist_id,
                        content=item_text,
                        position=i,
                    )
                )

        # Mark conversation as completed
        await self.update_conversation(
            conversation.id,
            AIConversationUpdate(
                status="completed",
                result={
                    **result,
                    "step": "applied",
                    "changes_applied": changes_applied,
                    "checklist_id": str(checklist_id) if checklist_id else None,
                },
            ),
        )

        return {
            "success": True,
            "message": "SMART предложение применено к задаче",
            "task_id": str(task_id),
            "changes_applied": changes_applied,
            "checklist_id": checklist_id,
        }
