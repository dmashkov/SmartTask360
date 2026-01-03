"""
SmartTask360 — AI Schemas
"""

from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field


# ============================================================================
# AI Message Schemas
# ============================================================================


class AIMessageCreate(BaseModel):
    """Schema for creating an AI message"""

    role: str = Field(..., description="Message role: user | assistant | system")
    content: str = Field(..., min_length=1, description="Message content")
    sequence: int = Field(..., ge=0, description="Message sequence number")
    token_count: int | None = Field(None, ge=0, description="Token count")
    model_used: str | None = Field(None, description="Model used for generation")


class AIMessageResponse(BaseModel):
    """Schema for AI message response"""

    id: UUID
    conversation_id: UUID
    role: str
    content: str
    sequence: int
    token_count: int | None
    model_used: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


# ============================================================================
# AI Conversation Schemas
# ============================================================================


class AIConversationCreate(BaseModel):
    """Schema for creating an AI conversation"""

    conversation_type: str = Field(
        ...,
        description="Type: smart_validation | task_dialog | risk_analysis | decomposition | progress_review",
    )
    task_id: UUID = Field(..., description="Related task ID")
    user_id: UUID = Field(..., description="User initiating conversation")
    model: str = Field(
        default="claude-sonnet-4-20250514", description="AI model to use"
    )
    temperature: float = Field(
        default=0.5, ge=0.0, le=1.0, description="Temperature for generation"
    )
    context: dict[str, Any] | None = Field(
        None, description="Initial context (task details, etc.)"
    )


class AIConversationUpdate(BaseModel):
    """Schema for updating an AI conversation"""

    status: str | None = Field(
        None, description="Status: active | completed | failed"
    )
    result: dict[str, Any] | None = Field(
        None, description="Final result (scores, suggestions, etc.)"
    )


class AIConversationResponse(BaseModel):
    """Schema for AI conversation response"""

    id: UUID
    conversation_type: str
    task_id: UUID
    user_id: UUID
    model: str
    temperature: float
    status: str
    context: dict[str, Any] | None
    result: dict[str, Any] | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None

    model_config = {"from_attributes": True}


class AIConversationWithMessages(AIConversationResponse):
    """Schema for conversation with messages"""

    messages: list[AIMessageResponse] = Field(default_factory=list)


# ============================================================================
# AI Request/Response Schemas
# ============================================================================


class AISendMessageRequest(BaseModel):
    """Schema for sending a message to AI"""

    content: str = Field(..., min_length=1, description="User message content")


class AISendMessageResponse(BaseModel):
    """Schema for AI message response"""

    conversation_id: UUID
    user_message: AIMessageResponse
    ai_message: AIMessageResponse


# ============================================================================
# SMART Validation Schemas
# ============================================================================


class SMARTCriterion(BaseModel):
    """Schema for individual SMART criterion"""

    name: str = Field(..., description="Criterion name: S, M, A, R, T")
    score: float = Field(..., ge=0.0, le=1.0, description="Score from 0.0 to 1.0")
    explanation: str = Field(..., description="Why this score was given")
    suggestions: list[str] = Field(
        default_factory=list, description="Suggestions for improvement"
    )


class SMARTValidationResult(BaseModel):
    """Schema for SMART validation result"""

    overall_score: float = Field(..., ge=0.0, le=1.0, description="Overall SMART score")
    is_valid: bool = Field(
        ..., description="True if task meets SMART criteria (score >= 0.7)"
    )
    criteria: list[SMARTCriterion] = Field(..., description="Individual criteria scores")
    summary: str = Field(..., description="Overall summary")
    recommended_changes: list[str] = Field(
        default_factory=list, description="Recommended changes"
    )


class SMARTValidationRequest(BaseModel):
    """Schema for SMART validation request"""

    task_id: UUID = Field(..., description="Task to validate")
    include_context: bool = Field(
        default=True, description="Include parent task and project context"
    )


class SMARTValidationResponse(BaseModel):
    """Schema for SMART validation response"""

    conversation_id: UUID
    validation: SMARTValidationResult


# ============================================================================
# AI Dialog Schemas
# ============================================================================


class StartDialogRequest(BaseModel):
    """Schema for starting task dialog"""

    task_id: UUID = Field(..., description="Task to discuss")
    dialog_type: str = Field(
        default="clarify",
        description="Dialog type: clarify | decompose | estimate | general",
    )
    initial_question: str | None = Field(
        None, description="Optional initial question from user"
    )


class StartDialogResponse(BaseModel):
    """Schema for dialog start response"""

    conversation_id: UUID
    ai_greeting: str = Field(..., description="AI's initial response/question")


class CompleteDialogRequest(BaseModel):
    """Schema for completing dialog"""

    apply_changes: bool = Field(
        default=True, description="Apply discussed changes to task"
    )


class CompleteDialogResponse(BaseModel):
    """Schema for dialog completion response"""

    success: bool
    message: str
    changes_summary: str | None = None
    task: dict[str, Any] | None = None


# ============================================================================
# AI Risk Analysis Schemas
# ============================================================================


class RiskItem(BaseModel):
    """Schema for individual risk item"""

    category: str = Field(..., description="Risk category: Technical | Resource | Schedule | Quality")
    severity: str = Field(..., description="Severity: High | Medium | Low")
    probability: str = Field(..., description="Probability: High | Medium | Low")
    description: str = Field(..., description="Risk description")
    mitigation: str = Field(..., description="Mitigation strategy")


class RiskAnalysisResult(BaseModel):
    """Schema for risk analysis result"""

    overall_risk_level: str = Field(..., description="Overall risk: High | Medium | Low")
    risks: list[RiskItem] = Field(default_factory=list, description="Identified risks")
    recommendations: list[str] = Field(default_factory=list, description="Risk mitigation recommendations")


class RiskAnalysisRequest(BaseModel):
    """Schema for risk analysis request"""

    task_id: UUID = Field(..., description="Task to analyze")
    include_context: bool = Field(default=True, description="Include task context")


class RiskAnalysisResponse(BaseModel):
    """Schema for risk analysis response"""

    conversation_id: UUID
    analysis: RiskAnalysisResult


# ============================================================================
# AI Comment Generation Schemas
# ============================================================================


class GenerateCommentRequest(BaseModel):
    """Schema for AI comment generation request"""

    task_id: UUID = Field(..., description="Task to comment on")
    comment_type: str = Field(
        default="insight",
        description="Comment type: insight | risk | progress | blocker | suggestion"
    )
    context: dict[str, Any] | None = Field(None, description="Additional context")


class GenerateCommentResponse(BaseModel):
    """Schema for AI comment response"""

    conversation_id: UUID
    comment_content: str = Field(..., description="Generated comment text")
    metadata: dict[str, Any] | None = Field(None, description="Additional metadata")


# ============================================================================
# AI Progress Review Schemas
# ============================================================================


class ProgressReviewRequest(BaseModel):
    """Schema for progress review request"""

    task_id: UUID = Field(..., description="Task to review")
    include_subtasks: bool = Field(default=True, description="Include subtask progress")


class ProgressReviewResponse(BaseModel):
    """Schema for progress review response"""

    conversation_id: UUID
    review: dict[str, Any] = Field(..., description="Progress review data")
