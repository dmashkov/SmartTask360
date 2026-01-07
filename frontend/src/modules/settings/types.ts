/**
 * SmartTask360 — Settings Types
 */

// AI Model enum (matches backend)
export type AIModel =
  | "claude-sonnet-4-20250514"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-5-haiku-20241022"
  | "claude-3-opus-20240229"
  | "claude-3-sonnet-20240229"
  | "claude-3-haiku-20240307";

// Model tier for display
export type AIModelTier = "recommended" | "premium" | "standard" | "economy";

// AI model info
export interface AIModelInfo {
  id: AIModel;
  name: string;
  description: string;
  tier: AIModelTier;
}

// AI Language enum (matches backend)
export type AILanguage = "ru" | "en";

// AI Language info
export interface AILanguageInfo {
  id: AILanguage;
  name: string;
  description: string;
}

// AI settings response
export interface AISettingsResponse {
  model: AIModel;
  language: AILanguage;
  available_models: AIModelInfo[];
  available_languages: AILanguageInfo[];
}

// AI settings update request
export interface AISettingsUpdate {
  model?: AIModel;
  language?: AILanguage;
}

// ============================================================================
// AI Prompts
// ============================================================================

// Prompt types enum (matches backend PromptType)
export type PromptType =
  | "smart_validation"
  | "task_dialog"
  | "risk_analysis"
  | "comment_generation"
  | "progress_review";

// Prompt info
export interface AIPromptInfo {
  id: string;
  name: string;
  description: string;
  variables: string[];
}

// Single prompt response
export interface AIPromptResponse {
  prompt_type: PromptType;
  content: string;
  is_custom: boolean;
  info: AIPromptInfo;
}

// All prompts response
export interface AIPromptsResponse {
  prompts: AIPromptResponse[];
}

// Prompt update request
export interface AIPromptUpdate {
  content: string;
}
