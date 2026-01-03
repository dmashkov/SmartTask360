"""
SmartTask360 — AI Router
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_db
from app.modules.ai.schemas import (
    AIConversationResponse,
    AIConversationWithMessages,
    AISendMessageRequest,
    AISendMessageResponse,
    CompleteDialogRequest,
    CompleteDialogResponse,
    GenerateCommentRequest,
    GenerateCommentResponse,
    ProgressReviewRequest,
    ProgressReviewResponse,
    RiskAnalysisRequest,
    RiskAnalysisResponse,
    SMARTValidationRequest,
    SMARTValidationResponse,
    StartDialogRequest,
    StartDialogResponse,
)
from app.modules.ai.service import AIService
from app.modules.users.models import User

router = APIRouter(prefix="/ai", tags=["AI"])


# ============================================================================
# Conversation Endpoints
# ============================================================================


@router.get("/conversations/{conversation_id}", response_model=AIConversationResponse)
async def get_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get AI conversation by ID"""
    service = AIService(db)
    conversation = await service.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check access (user must be conversation owner)
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return conversation


@router.get(
    "/conversations/{conversation_id}/messages",
    response_model=AIConversationWithMessages,
)
async def get_conversation_with_messages(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation with all messages"""
    service = AIService(db)
    conversation = await service.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check access
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    # Get messages
    messages = await service.get_conversation_messages(conversation_id)

    # Create response dict from conversation
    conv_dict = {
        "id": conversation.id,
        "conversation_type": conversation.conversation_type,
        "task_id": conversation.task_id,
        "user_id": conversation.user_id,
        "model": conversation.model,
        "temperature": conversation.temperature,
        "status": conversation.status,
        "context": conversation.context,
        "result": conversation.result,
        "created_at": conversation.created_at,
        "updated_at": conversation.updated_at,
        "completed_at": conversation.completed_at,
        "messages": messages,
    }

    return AIConversationWithMessages(**conv_dict)


@router.get("/tasks/{task_id}/conversations", response_model=list[AIConversationResponse])
async def get_task_conversations(
    task_id: UUID,
    conversation_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all AI conversations for a task"""
    service = AIService(db)
    conversations = await service.get_conversations_by_task(task_id, conversation_type)

    # Filter by user access
    user_conversations = [c for c in conversations if c.user_id == current_user.id]

    return user_conversations


@router.delete("/conversations/{conversation_id}", status_code=204)
async def delete_conversation(
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete AI conversation"""
    service = AIService(db)
    conversation = await service.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check access
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    await service.delete_conversation(conversation_id)


# ============================================================================
# AI Interaction Endpoints
# ============================================================================


@router.post(
    "/conversations/{conversation_id}/messages", response_model=AISendMessageResponse
)
async def send_message(
    conversation_id: UUID,
    message: AISendMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message to AI and get response.

    For task_dialog conversations, preserves task context and uses appropriate system prompt.
    """
    service = AIService(db)

    # Check conversation exists and user has access
    conversation = await service.get_conversation_by_id(conversation_id)
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    try:
        user_msg, ai_msg = await service.send_message_to_ai(
            conversation_id, message.content
        )

        return AISendMessageResponse(
            conversation_id=conversation_id, user_message=user_msg, ai_message=ai_msg
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


# ============================================================================
# SMART Validation Endpoint
# ============================================================================


@router.post("/validate-smart", response_model=SMARTValidationResponse)
async def validate_task_smart(
    request: SMARTValidationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Validate task against SMART criteria.

    Creates an AI conversation and returns validation result.
    """
    # Get task details (would need TaskService integration)
    # For now, this is a placeholder - will be implemented in Session 1C.2
    from app.modules.tasks.service import TaskService

    task_service = TaskService(db)
    task = await task_service.get_by_id(request.task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Build context
    context = None
    if request.include_context:
        context = {
            "task_id": str(task.id),
            "priority": task.priority,
            "status": task.status,
        }

        # Add parent task if exists
        if task.parent_id:
            parent = await task_service.get_by_id(task.parent_id)
            if parent:
                context["parent_task"] = {
                    "title": parent.title,
                    "description": parent.description,
                }

    # Validate
    service = AIService(db)
    try:
        conversation, validation = await service.validate_task_smart(
            task_id=task.id,
            user_id=current_user.id,
            task_title=task.title,
            task_description=task.description or "",
            context=context,
        )

        return SMARTValidationResponse(
            conversation_id=conversation.id, validation=validation
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


# ============================================================================
# SMART Validation History & Apply Suggestions
# ============================================================================


@router.get("/tasks/{task_id}/smart-validations", response_model=list[AIConversationResponse])
async def get_task_smart_validations(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all SMART validation conversations for a task.

    Returns validation history ordered by date (newest first).
    """
    service = AIService(db)
    conversations = await service.get_conversations_by_task(
        task_id, conversation_type="smart_validation"
    )

    # Filter by user access
    user_conversations = [c for c in conversations if c.user_id == current_user.id]

    return user_conversations


@router.post("/tasks/{task_id}/apply-smart-suggestions")
async def apply_smart_suggestions(
    task_id: UUID,
    conversation_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Apply AI suggestions to task based on SMART validation.

    Updates task title and description with AI-recommended changes.
    Requires conversation_id from previous validation.
    """
    from app.modules.tasks.service import TaskService
    from app.modules.tasks.schemas import TaskUpdate

    # Get conversation
    ai_service = AIService(db)
    conversation = await ai_service.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check conversation belongs to this task and user
    if conversation.task_id != task_id:
        raise HTTPException(
            status_code=400, detail="Conversation does not belong to this task"
        )

    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if not conversation.result:
        raise HTTPException(
            status_code=400, detail="Conversation has no validation result"
        )

    # Get task
    task_service = TaskService(db)
    task = await task_service.get_by_id(task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Extract recommended changes from validation
    validation_result = conversation.result
    recommended_changes = validation_result.get("recommended_changes", [])

    if not recommended_changes:
        raise HTTPException(
            status_code=400, detail="No recommendations available to apply"
        )

    # Build improved description
    current_desc = task.description or ""
    improvements = "\n\n**AI Recommended Improvements:**\n" + "\n".join(
        f"- {change}" for change in recommended_changes
    )

    updated_description = current_desc + improvements

    # Update task
    update_data = TaskUpdate(description=updated_description)
    updated_task = await task_service.update(task_id, update_data)

    return {
        "success": True,
        "message": f"Applied {len(recommended_changes)} AI suggestions to task",
        "recommendations_applied": recommended_changes,
        "task": updated_task,
    }


# ============================================================================
# AI Task Dialog Endpoints
# ============================================================================


@router.post("/tasks/{task_id}/start-dialog", response_model=StartDialogResponse)
async def start_task_dialog(
    task_id: UUID,
    request: StartDialogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start an interactive AI dialog for task clarification.

    Dialog types:
    - clarify: Ask questions to make task more specific
    - decompose: Break down into subtasks
    - estimate: Help with effort estimation
    - general: Open-ended task discussion
    """
    from app.modules.tasks.service import TaskService

    # Get task
    task_service = TaskService(db)
    task = await task_service.get_by_id(task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Build context
    context = {
        "task_id": str(task.id),
        "priority": task.priority,
        "status": task.status,
    }

    # Add parent task if exists
    if task.parent_id:
        parent = await task_service.get_by_id(task.parent_id)
        if parent:
            context["parent_task"] = {
                "title": parent.title,
                "description": parent.description,
            }

    # Start dialog
    ai_service = AIService(db)
    try:
        conversation, ai_greeting = await ai_service.start_task_dialog(
            task_id=task.id,
            user_id=current_user.id,
            task_title=task.title,
            task_description=task.description or "",
            dialog_type=request.dialog_type,
            initial_question=request.initial_question,
            context=context,
        )

        return StartDialogResponse(
            conversation_id=conversation.id, ai_greeting=ai_greeting
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


@router.post(
    "/conversations/{conversation_id}/complete-dialog",
    response_model=CompleteDialogResponse,
)
async def complete_task_dialog(
    conversation_id: UUID,
    request: CompleteDialogRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Complete task dialog and optionally apply discussed changes.

    Returns summary of key points and recommendations.
    If apply_changes=True, updates task with AI suggestions.
    """
    from app.modules.tasks.service import TaskService
    from app.modules.tasks.schemas import TaskUpdate

    # Get conversation
    ai_service = AIService(db)
    conversation = await ai_service.get_conversation_by_id(conversation_id)

    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    # Check access
    if conversation.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    if conversation.conversation_type != "task_dialog":
        raise HTTPException(
            status_code=400, detail="Conversation is not a task dialog"
        )

    if conversation.status == "completed":
        raise HTTPException(status_code=400, detail="Dialog already completed")

    # Complete dialog and get summary
    try:
        summary_data = await ai_service.complete_task_dialog(
            conversation_id, apply_changes=request.apply_changes
        )

        # If apply_changes, update task with suggestions
        updated_task = None
        if request.apply_changes:
            task_service = TaskService(db)
            task = await task_service.get_by_id(conversation.task_id)

            if task and not task.is_deleted:
                # Extract suggested changes
                suggested_title = summary_data.get("suggested_title")
                suggested_description = summary_data.get("suggested_description")

                update_data = TaskUpdate()
                if suggested_title and suggested_title != task.title:
                    update_data.title = suggested_title

                if suggested_description and suggested_description != task.description:
                    update_data.description = suggested_description

                # Update task if there are changes
                if update_data.title or update_data.description:
                    task_obj = await task_service.update(
                        conversation.task_id, update_data
                    )
                    # Convert to dict for response
                    if task_obj:
                        from app.modules.tasks.schemas import TaskResponse
                        updated_task = TaskResponse.model_validate(task_obj).model_dump()

        # Build changes summary
        changes_summary = None
        if request.apply_changes:
            key_points = summary_data.get("key_points", [])
            recommendations = summary_data.get("recommendations", [])
            changes_summary = (
                f"Applied {len(key_points)} key points and "
                f"{len(recommendations)} recommendations from dialog"
            )

        return CompleteDialogResponse(
            success=True,
            message="Dialog completed successfully",
            changes_summary=changes_summary,
            task=updated_task,
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


# ============================================================================
# AI Risk Analysis Endpoint
# ============================================================================


@router.post("/analyze-risks", response_model=RiskAnalysisResponse)
async def analyze_task_risks(
    request: RiskAnalysisRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Analyze task for potential risks and blockers.

    Identifies technical, resource, schedule, and quality risks.
    Returns risk severity, probability, and mitigation strategies.
    """
    from app.modules.tasks.service import TaskService

    task_service = TaskService(db)
    task = await task_service.get_by_id(request.task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Build context
    context = None
    if request.include_context:
        context = {
            "task_id": str(task.id),
            "priority": task.priority,
            "status": task.status,
            "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
        }

        # Add parent task if exists
        if task.parent_id:
            parent = await task_service.get_by_id(task.parent_id)
            if parent:
                context["parent_task"] = {
                    "title": parent.title,
                    "description": parent.description,
                }

    # Analyze risks
    service = AIService(db)
    try:
        conversation, risk_analysis = await service.analyze_task_risks(
            task_id=task.id,
            user_id=current_user.id,
            task_title=task.title,
            task_description=task.description or "",
            context=context,
        )

        from app.modules.ai.schemas import RiskAnalysisResult

        return RiskAnalysisResponse(
            conversation_id=conversation.id,
            analysis=RiskAnalysisResult(**risk_analysis),
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


# ============================================================================
# AI Comment Generation Endpoint
# ============================================================================


@router.post("/generate-comment", response_model=GenerateCommentResponse)
async def generate_ai_comment(
    request: GenerateCommentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI-powered comment for task.

    Comment types:
    - insight: Key considerations and best practices
    - risk: Top risk identification and mitigation
    - progress: Progress check and next steps
    - blocker: Potential blockers and dependencies
    - suggestion: Improvement suggestions
    """
    from app.modules.tasks.service import TaskService

    task_service = TaskService(db)
    task = await task_service.get_by_id(request.task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Build context
    context = request.context or {}
    context.update({
        "task_id": str(task.id),
        "status": task.status,
        "priority": task.priority,
    })

    if task.assignee_id:
        context["assignee"] = str(task.assignee_id)

    # Generate comment
    service = AIService(db)
    try:
        conversation, comment_content = await service.generate_ai_comment(
            task_id=task.id,
            user_id=current_user.id,
            task_title=task.title,
            task_description=task.description or "",
            comment_type=request.comment_type,
            context=context,
        )

        return GenerateCommentResponse(
            conversation_id=conversation.id,
            comment_content=comment_content,
            metadata={"comment_type": request.comment_type},
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


# ============================================================================
# AI Progress Review Endpoint
# ============================================================================


@router.post("/review-progress", response_model=ProgressReviewResponse)
async def review_task_progress(
    request: ProgressReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Review task progress and provide insights.

    Analyzes task status, subtask completion, and provides:
    - Progress assessment (on track / at risk / blocked)
    - What's going well
    - Concerns or blockers
    - Recommended next steps
    """
    from app.modules.tasks.service import TaskService

    task_service = TaskService(db)
    task = await task_service.get_by_id(request.task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Get subtasks if requested
    subtasks = None
    if request.include_subtasks:
        from sqlalchemy import select
        from app.modules.tasks.models import Task

        query = select(Task).where(Task.parent_id == task.id, Task.is_deleted == False)
        result = await db.execute(query)
        subtask_objs = result.scalars().all()

        if subtask_objs:
            subtasks = [
                {
                    "id": str(st.id),
                    "title": st.title,
                    "status": st.status,
                    "priority": st.priority,
                }
                for st in subtask_objs
            ]

    # Build context
    context = {
        "task_id": str(task.id),
        "created_at": task.created_at.isoformat() if task.created_at else None,
        "estimated_hours": float(task.estimated_hours) if task.estimated_hours else None,
        "priority": task.priority,
    }

    # Review progress
    service = AIService(db)
    try:
        conversation, review_result = await service.review_task_progress(
            task_id=task.id,
            user_id=current_user.id,
            task_title=task.title,
            task_description=task.description or "",
            task_status=task.status,
            subtasks=subtasks,
            context=context,
        )

        return ProgressReviewResponse(
            conversation_id=conversation.id,
            review=review_result,
        )

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")


# ============================================================================
# AI Auto-Comment (Generate + Create Comment)
# ============================================================================


@router.post("/tasks/{task_id}/auto-comment")
async def create_ai_auto_comment(
    task_id: UUID,
    comment_type: str = "insight",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Generate AI comment and automatically add it to task.

    This endpoint:
    1. Generates AI comment using specified type
    2. Creates actual comment on task with AI content
    3. Marks comment as AI-generated

    Returns the created comment with AI metadata.
    """
    from app.modules.tasks.service import TaskService
    from app.modules.comments.service import CommentService
    from app.modules.comments.schemas import CommentCreate

    task_service = TaskService(db)
    task = await task_service.get_by_id(task_id)

    if not task or task.is_deleted:
        raise HTTPException(status_code=404, detail="Task not found")

    # Build context
    context = {
        "task_id": str(task.id),
        "status": task.status,
        "priority": task.priority,
    }

    if task.assignee_id:
        context["assignee"] = str(task.assignee_id)

    # Generate AI comment
    ai_service = AIService(db)
    try:
        conversation, comment_content = await ai_service.generate_ai_comment(
            task_id=task.id,
            user_id=current_user.id,
            task_title=task.title,
            task_description=task.description or "",
            comment_type=comment_type,
            context=context,
        )

        # Create actual comment on task
        comment_service = CommentService(db)

        # Add AI attribution
        ai_comment_text = f"{comment_content}\n\n_— AI Assistant ({comment_type})_"

        comment_data = CommentCreate(
            content=ai_comment_text,
            task_id=task.id,
        )

        comment = await comment_service.create(comment_data, current_user.id)

        return {
            "success": True,
            "comment": comment,
            "conversation_id": conversation.id,
            "ai_metadata": {
                "comment_type": comment_type,
                "original_content": comment_content,
            },
        }

    except Exception as e:
        raise HTTPException(status_code=503, detail=f"AI service error: {str(e)}")
