/**
 * SmartTask360 — AI Types
 */

// SMART validation criteria
export interface SMARTCriterion {
  name: "Specific" | "Measurable" | "Achievable" | "Relevant" | "Time-bound";
  score: number; // 0.0 - 1.0
  explanation: string;
  suggestions: string[];
}

// Acceptance criterion (DoD item)
export interface AcceptanceCriterion {
  description: string;
  verification: string;
}

// SMART validation result
export interface SMARTValidationResult {
  overall_score: number;
  is_valid: boolean;
  criteria: SMARTCriterion[];
  summary: string;
  recommended_changes: string[];
  acceptance_criteria: AcceptanceCriterion[];
}

// SMART validation response
export interface SMARTValidationResponse {
  conversation_id: string;
  validation: SMARTValidationResult;
}

// Request to validate a task
export interface SMARTValidationRequest {
  task_id: string;
  include_context?: boolean;
}

// Inline validation (for task form before saving)
export interface InlineSMARTValidationRequest {
  title: string;
  description: string;
  project_context?: {
    project_name?: string;
    project_goal?: string;
  };
}

// AI message
export interface AIMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sequence: number;
  token_count: number | null;
  model_used: string | null;
  created_at: string;
}

// AI conversation
export interface AIConversation {
  id: string;
  conversation_type: string;
  task_id: string;
  user_id: string;
  model: string;
  temperature: number;
  status: "active" | "completed" | "failed";
  context: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// AI conversation with messages
export interface AIConversationWithMessages extends AIConversation {
  messages: AIMessage[];
}

// Dialog types
export type DialogType = "clarify" | "decompose" | "estimate" | "general";

// Start dialog request
export interface StartDialogRequest {
  task_id: string;
  dialog_type: DialogType;
  initial_question?: string;
}

// Start dialog response
export interface StartDialogResponse {
  conversation_id: string;
  ai_greeting: string;
}

// Send message request
export interface SendMessageRequest {
  content: string;
}

// Send message response
export interface SendMessageResponse {
  conversation_id: string;
  user_message: AIMessage;
  ai_message: AIMessage;
}

// ============================================================================
// SMART Wizard Types
// ============================================================================

// Question option (for radio/checkbox questions)
export interface AIQuestionOption {
  value: string;
  label: string;
  description?: string;
}

// AI clarifying question
export interface AIQuestion {
  id: string;
  type: "radio" | "checkbox" | "text";
  question: string;
  options?: AIQuestionOption[];
  required: boolean;
  default_value?: string | string[];
}

// User answer to AI question
export interface AIAnswer {
  question_id: string;
  value: string | string[];
}

// Time estimate breakdown item
export interface TimeEstimateBreakdown {
  task: string;
  hours: number;
}

// Time estimate
export interface TimeEstimate {
  total_hours: number;
  total_days: number;
  breakdown: TimeEstimateBreakdown[];
  confidence: "high" | "medium" | "low";
}

// SMART proposal
export interface SMARTProposal {
  title: string;
  description: string;
  definition_of_done: string[];
  time_estimate?: TimeEstimate;
  smart_scores?: SMARTValidationResult;
}

// SMART Analyze request (Step 1)
export interface SMARTAnalyzeRequest {
  task_id: string;
  include_context?: boolean;
}

// SMART Analyze response
export interface SMARTAnalyzeResponse {
  conversation_id: string;
  initial_assessment: string;
  questions: AIQuestion[];
  can_skip: boolean;
}

// SMART Refine request (Step 2)
export interface SMARTRefineRequest {
  conversation_id: string;
  answers: AIAnswer[];
  additional_context?: string;
}

// SMART Refine response
export interface SMARTRefineResponse {
  conversation_id: string;
  proposal: SMARTProposal;
  original_task: {
    title: string;
    description: string;
  };
}

// SMART Apply request (Step 3)
export interface SMARTApplyRequest {
  conversation_id: string;
  apply_title?: boolean;
  apply_description?: boolean;
  apply_dod?: boolean;
  custom_title?: string;
  custom_description?: string;
  custom_dod?: string[];
}

// SMART Apply response
export interface SMARTApplyResponse {
  success: boolean;
  message: string;
  task_id: string;
  changes_applied: string[];
  checklist_id?: string;
}

// Wizard step type
export type SMARTWizardStep = "idle" | "analyzing" | "questions" | "refining" | "proposal" | "applying" | "done";
