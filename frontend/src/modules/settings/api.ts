/**
 * SmartTask360 — Settings API
 */

import { api } from "../../shared/api";
import type {
  AISettingsResponse,
  AISettingsUpdate,
  AIPromptsResponse,
  AIPromptResponse,
  AIPromptUpdate,
  PromptType,
} from "./types";

// Get AI settings
export async function getAISettings(): Promise<AISettingsResponse> {
  const response = await api.get<AISettingsResponse>("/settings/ai");
  return response.data;
}

// Update AI settings
export async function updateAISettings(
  data: AISettingsUpdate
): Promise<AISettingsResponse> {
  const response = await api.put<AISettingsResponse>("/settings/ai", data);
  return response.data;
}

// ============================================================================
// AI Prompts
// ============================================================================

// Get all AI prompts
export async function getAIPrompts(): Promise<AIPromptsResponse> {
  const response = await api.get<AIPromptsResponse>("/settings/ai/prompts");
  return response.data;
}

// Get single AI prompt
export async function getAIPrompt(
  promptType: PromptType
): Promise<AIPromptResponse> {
  const response = await api.get<AIPromptResponse>(
    `/settings/ai/prompts/${promptType}`
  );
  return response.data;
}

// Update AI prompt
export async function updateAIPrompt(
  promptType: PromptType,
  data: AIPromptUpdate
): Promise<AIPromptResponse> {
  const response = await api.put<AIPromptResponse>(
    `/settings/ai/prompts/${promptType}`,
    data
  );
  return response.data;
}

// Reset AI prompt to default
export async function resetAIPrompt(
  promptType: PromptType
): Promise<AIPromptResponse> {
  const response = await api.delete<AIPromptResponse>(
    `/settings/ai/prompts/${promptType}`
  );
  return response.data;
}
