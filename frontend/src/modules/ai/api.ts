/**
 * SmartTask360 — AI API Functions
 */

import { api } from "../../shared/api";
import type {
  SMARTValidationResponse,
  SMARTValidationRequest,
  InlineSMARTValidationRequest,
  AIConversation,
  AIConversationWithMessages,
  StartDialogRequest,
  StartDialogResponse,
  SendMessageResponse,
  // SMART Wizard types
  SMARTAnalyzeRequest,
  SMARTAnalyzeResponse,
  SMARTRefineRequest,
  SMARTRefineResponse,
  SMARTApplyRequest,
  SMARTApplyResponse,
  // Risk Analysis types
  RiskAnalysisRequest,
  RiskAnalysisResponse,
  // AI Comment types
  AICommentType,
  GenerateCommentResponse,
  AutoCommentResponse,
  // Progress Review types
  ProgressReviewRequest,
  ProgressReviewResponse,
} from "./types";

/**
 * Validate a saved task against SMART criteria
 */
export async function validateTaskSMART(
  data: SMARTValidationRequest
): Promise<SMARTValidationResponse> {
  const response = await api.post<SMARTValidationResponse>(
    "/ai/validate-smart",
    data
  );
  return response.data;
}

/**
 * Validate task data inline (without saving) - for task form preview
 * Note: This requires a temporary task or a new endpoint.
 * For MVP, we'll use the existing endpoint after task is saved.
 */
export async function validateInlineSMART(
  data: InlineSMARTValidationRequest
): Promise<SMARTValidationResponse> {
  // For now, this endpoint needs to be created on backend
  // It will validate without requiring a saved task
  const response = await api.post<SMARTValidationResponse>(
    "/ai/validate-smart-inline",
    data
  );
  return response.data;
}

/**
 * Get SMART validation history for a task
 */
export async function getTaskSMARTValidations(
  taskId: string
): Promise<AIConversation[]> {
  const response = await api.get<AIConversation[]>(
    `/ai/tasks/${taskId}/smart-validations`
  );
  return response.data;
}

/**
 * Apply SMART suggestions to task
 */
export async function applySMARTSuggestions(
  taskId: string,
  conversationId: string
): Promise<{ success: boolean; message: string; recommendations_applied: string[] }> {
  const response = await api.post<{ success: boolean; message: string; recommendations_applied: string[] }>(
    `/ai/tasks/${taskId}/apply-smart-suggestions?conversation_id=${conversationId}`
  );
  return response.data;
}

/**
 * Get AI conversation by ID
 */
export async function getConversation(
  conversationId: string
): Promise<AIConversation> {
  const response = await api.get<AIConversation>(
    `/ai/conversations/${conversationId}`
  );
  return response.data;
}

/**
 * Get conversation with messages
 */
export async function getConversationWithMessages(
  conversationId: string
): Promise<AIConversationWithMessages> {
  const response = await api.get<AIConversationWithMessages>(
    `/ai/conversations/${conversationId}/messages`
  );
  return response.data;
}

/**
 * Start AI dialog for task
 */
export async function startDialog(
  data: StartDialogRequest
): Promise<StartDialogResponse> {
  const response = await api.post<StartDialogResponse>(
    `/ai/tasks/${data.task_id}/start-dialog`,
    {
      task_id: data.task_id,
      dialog_type: data.dialog_type,
      initial_question: data.initial_question,
    }
  );
  return response.data;
}

/**
 * Send message to AI in conversation
 */
export async function sendMessage(
  conversationId: string,
  content: string
): Promise<SendMessageResponse> {
  const response = await api.post<SendMessageResponse>(
    `/ai/conversations/${conversationId}/messages`,
    { content }
  );
  return response.data;
}

/**
 * Delete AI conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  await api.delete(`/ai/conversations/${conversationId}`);
}

/**
 * Get all AI conversations for a task
 */
export async function getTaskConversations(
  taskId: string,
  conversationType?: string
): Promise<AIConversation[]> {
  const params = conversationType ? `?conversation_type=${conversationType}` : "";
  const response = await api.get<AIConversation[]>(
    `/ai/tasks/${taskId}/conversations${params}`
  );
  return response.data;
}

// ============================================================================
// SMART Wizard API Functions
// ============================================================================

/**
 * Step 1: Analyze task and generate clarifying questions
 */
export async function smartAnalyze(
  data: SMARTAnalyzeRequest
): Promise<SMARTAnalyzeResponse> {
  const response = await api.post<SMARTAnalyzeResponse>(
    "/ai/smart/analyze",
    data
  );
  return response.data;
}

/**
 * Step 2: Generate SMART proposal based on user answers
 */
export async function smartRefine(
  data: SMARTRefineRequest
): Promise<SMARTRefineResponse> {
  const response = await api.post<SMARTRefineResponse>(
    "/ai/smart/refine",
    data
  );
  return response.data;
}

/**
 * Step 3: Apply SMART proposal to task
 */
export async function smartApply(
  data: SMARTApplyRequest
): Promise<SMARTApplyResponse> {
  const response = await api.post<SMARTApplyResponse>(
    "/ai/smart/apply",
    data
  );
  return response.data;
}

// ============================================================================
// Risk Analysis API Functions
// ============================================================================

/**
 * Analyze task risks
 */
export async function analyzeRisks(
  data: RiskAnalysisRequest
): Promise<RiskAnalysisResponse> {
  const response = await api.post<RiskAnalysisResponse>(
    "/ai/analyze-risks",
    data
  );
  return response.data;
}

// ============================================================================
// AI Comment API Functions
// ============================================================================

/**
 * Generate AI comment (without saving to task)
 */
export async function generateComment(
  taskId: string,
  commentType: AICommentType
): Promise<GenerateCommentResponse> {
  const response = await api.post<GenerateCommentResponse>(
    "/ai/generate-comment",
    { task_id: taskId, comment_type: commentType }
  );
  return response.data;
}

/**
 * Generate and save AI comment to task
 */
export async function autoComment(
  taskId: string,
  commentType: AICommentType
): Promise<AutoCommentResponse> {
  const response = await api.post<AutoCommentResponse>(
    `/ai/tasks/${taskId}/auto-comment`,
    { comment_type: commentType }
  );
  return response.data;
}

// ============================================================================
// Progress Review API Functions
// ============================================================================

/**
 * Review task progress
 */
export async function reviewProgress(
  data: ProgressReviewRequest
): Promise<ProgressReviewResponse> {
  const response = await api.post<ProgressReviewResponse>(
    "/ai/review-progress",
    data
  );
  return response.data;
}

/**
 * Complete dialog and summarize
 */
export async function completeDialog(
  conversationId: string,
  applyChanges: boolean = false
): Promise<{ summary: Record<string, unknown> }> {
  const response = await api.post<{ summary: Record<string, unknown> }>(
    `/ai/conversations/${conversationId}/complete-dialog`,
    { apply_changes: applyChanges }
  );
  return response.data;
}
