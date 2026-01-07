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


class AcceptanceCriterion(BaseModel):
    """Schema for acceptance criterion (DoD item)"""

    description: str = Field(..., description="Criterion description")
    verification: str = Field(..., description="How to verify this criterion is met")


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
    acceptance_criteria: list[AcceptanceCriterion] = Field(
        default_factory=list, description="Suggested acceptance criteria (Definition of Done)"
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


# ============================================================================
# SMART Wizard Schemas (Interactive SMART refinement)
# ============================================================================


class AIQuestionOption(BaseModel):
    """Schema for question option"""

    value: str = Field(..., description="Option value for submission")
    label: str = Field(..., description="Display label")
    description: str | None = Field(None, description="Optional description")


class AIQuestion(BaseModel):
    """Schema for AI clarifying question"""

    id: str = Field(..., description="Question ID (q1, q2, etc.)")
    type: str = Field(..., description="Question type: radio | checkbox | text")
    question: str = Field(..., description="Question text")
    options: list[AIQuestionOption] | None = Field(
        None, description="Options for radio/checkbox"
    )
    required: bool = Field(default=True, description="Is answer required")
    default_value: str | list[str] | None = Field(None, description="Default value")


class AIAnswer(BaseModel):
    """Schema for user answer to AI question"""

    question_id: str = Field(..., description="Question ID")
    value: str | list[str] = Field(..., description="Answer value(s)")


class TimeEstimateBreakdown(BaseModel):
    """Schema for time estimate breakdown item"""

    task: str = Field(..., description="Sub-task description")
    hours: float = Field(..., ge=0, description="Estimated hours")


class TimeEstimate(BaseModel):
    """Schema for time estimate"""

    total_hours: float = Field(..., ge=0, description="Total estimated hours")
    total_days: float = Field(..., ge=0, description="Total days (8h/day)")
    breakdown: list[TimeEstimateBreakdown] = Field(
        default_factory=list, description="Breakdown by sub-tasks"
    )
    confidence: str = Field(
        default="medium", description="Estimate confidence: high | medium | low"
    )


class SMARTProposal(BaseModel):
    """Schema for SMART task proposal"""

    title: str = Field(..., description="Proposed task title")
    description: str = Field(..., description="Proposed detailed description")
    definition_of_done: list[str] = Field(
        default_factory=list, description="Acceptance criteria / DoD items"
    )
    time_estimate: TimeEstimate | None = Field(None, description="Time estimate")
    smart_scores: SMARTValidationResult | None = Field(
        None, description="SMART validation of the proposal"
    )


class SMARTAnalyzeRequest(BaseModel):
    """Schema for SMART analyze request (Step 1)"""

    task_id: UUID = Field(..., description="Task to analyze")
    include_context: bool = Field(
        default=True, description="Include parent task and project context"
    )


class SMARTAnalyzeResponse(BaseModel):
    """Schema for SMART analyze response with questions"""

    conversation_id: UUID
    initial_assessment: str = Field(
        ..., description="AI's initial assessment of the task"
    )
    questions: list[AIQuestion] = Field(
        default_factory=list, description="Clarifying questions"
    )
    can_skip: bool = Field(
        default=False,
        description="True if task is already well-defined and questions can be skipped",
    )


class SMARTRefineRequest(BaseModel):
    """Schema for SMART refine request (Step 2)"""

    conversation_id: UUID = Field(..., description="Conversation from analyze step")
    answers: list[AIAnswer] = Field(..., description="Answers to AI questions")
    additional_context: str | None = Field(
        None, description="Any additional context from user"
    )


class SMARTRefineResponse(BaseModel):
    """Schema for SMART refine response with proposal"""

    conversation_id: UUID
    proposal: SMARTProposal
    original_task: dict[str, Any] = Field(
        ..., description="Original task data for comparison"
    )


class SMARTApplyRequest(BaseModel):
    """Schema for applying SMART proposal to task"""

    conversation_id: UUID = Field(..., description="Conversation with proposal")
    apply_title: bool = Field(default=True, description="Apply proposed title")
    apply_description: bool = Field(
        default=True, description="Apply proposed description"
    )
    apply_dod: bool = Field(
        default=True, description="Create checklist from DoD items"
    )
    custom_title: str | None = Field(
        None, description="Custom title override (if user edited)"
    )
    custom_description: str | None = Field(
        None, description="Custom description override (if user edited)"
    )
    custom_dod: list[str] | None = Field(
        None, description="Custom DoD override (if user edited)"
    )


class SMARTApplyResponse(BaseModel):
    """Schema for SMART apply response"""

    success: bool
    message: str
    task_id: UUID
    changes_applied: list[str] = Field(
        default_factory=list, description="List of applied changes"
    )
    checklist_id: UUID | None = Field(
        None, description="Created checklist ID (if DoD applied)"
    )
