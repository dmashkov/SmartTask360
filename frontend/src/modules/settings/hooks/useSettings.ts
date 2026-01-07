/**
 * SmartTask360 — Settings Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAISettings,
  updateAISettings,
  getAIPrompts,
  getAIPrompt,
  updateAIPrompt,
  resetAIPrompt,
} from "../api";
import type { AISettingsUpdate, AIPromptUpdate, PromptType } from "../types";

// Query keys
export const settingsKeys = {
  all: ["settings"] as const,
  ai: () => [...settingsKeys.all, "ai"] as const,
  prompts: () => [...settingsKeys.all, "prompts"] as const,
  prompt: (type: PromptType) => [...settingsKeys.prompts(), type] as const,
};

// Get AI settings
export function useAISettings() {
  return useQuery({
    queryKey: settingsKeys.ai(),
    queryFn: getAISettings,
  });
}

// Update AI settings
export function useUpdateAISettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AISettingsUpdate) => updateAISettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.ai() });
    },
  });
}

// ============================================================================
// AI Prompts Hooks
// ============================================================================

// Get all AI prompts
export function useAIPrompts() {
  return useQuery({
    queryKey: settingsKeys.prompts(),
    queryFn: getAIPrompts,
  });
}

// Get single AI prompt
export function useAIPrompt(promptType: PromptType) {
  return useQuery({
    queryKey: settingsKeys.prompt(promptType),
    queryFn: () => getAIPrompt(promptType),
  });
}

// Update AI prompt
export function useUpdateAIPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      promptType,
      data,
    }: {
      promptType: PromptType;
      data: AIPromptUpdate;
    }) => updateAIPrompt(promptType, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.prompts() });
      queryClient.invalidateQueries({
        queryKey: settingsKeys.prompt(variables.promptType),
      });
    },
  });
}

// Reset AI prompt to default
export function useResetAIPrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (promptType: PromptType) => resetAIPrompt(promptType),
    onSuccess: (_, promptType) => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.prompts() });
      queryClient.invalidateQueries({
        queryKey: settingsKeys.prompt(promptType),
      });
    },
  });
}
