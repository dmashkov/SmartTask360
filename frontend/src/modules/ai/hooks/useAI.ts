/**
 * SmartTask360 — AI React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  validateTaskSMART,
  getTaskSMARTValidations,
  applySMARTSuggestions,
  getConversation,
  getConversationWithMessages,
  startDialog,
  sendMessage,
  deleteConversation,
  getTaskConversations,
  // SMART Wizard
  smartAnalyze,
  smartRefine,
  smartApply,
  // Risk Analysis
  analyzeRisks,
  // AI Comments
  generateComment,
  autoComment,
  // Progress Review
  reviewProgress,
  // Dialog completion
  completeDialog,
} from "../api";
import type {
  SMARTValidationRequest,
  StartDialogRequest,
  // SMART Wizard types
  SMARTAnalyzeRequest,
  SMARTRefineRequest,
  SMARTApplyRequest,
  // Risk Analysis types
  RiskAnalysisRequest,
  // AI Comment types
  AICommentType,
  // Progress Review types
  ProgressReviewRequest,
} from "../types";

/**
 * Hook to validate task against SMART criteria
 */
export function useValidateSMART() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SMARTValidationRequest) => validateTaskSMART(data),
    onSuccess: async (result, variables) => {
      // Refetch task SMART validations cache
      await queryClient.refetchQueries({
        queryKey: ["smart-validations", variables.task_id],
      });
      // Also refetch task to update smart_score
      await queryClient.refetchQueries({
        queryKey: ["task", variables.task_id],
      });
      // Refetch task conversations to show new conversation in history
      await queryClient.refetchQueries({
        predicate: (query) =>
          query.queryKey[0] === "task-conversations" &&
          query.queryKey[1] === variables.task_id,
      });
      // Pre-fetch the conversation messages for immediate display
      if (result.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: ["conversation-messages", result.conversation_id],
        });
      }
    },
  });
}

/**
 * Hook to get SMART validation history for a task
 */
export function useTaskSMARTValidations(taskId: string | undefined) {
  return useQuery({
    queryKey: ["smart-validations", taskId],
    queryFn: () => getTaskSMARTValidations(taskId!),
    enabled: !!taskId,
  });
}

/**
 * Hook to apply SMART suggestions to task
 */
export function useApplySMARTSuggestions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      conversationId,
    }: {
      taskId: string;
      conversationId: string;
    }) => applySMARTSuggestions(taskId, conversationId),
    onSuccess: (_, variables) => {
      // Invalidate task cache to refresh description
      queryClient.invalidateQueries({
        queryKey: ["task", variables.taskId],
      });
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
    },
  });
}

/**
 * Hook to get AI conversation
 */
export function useConversation(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
  });
}

/**
 * Hook to get conversation with messages
 */
export function useConversationWithMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: ["conversation-messages", conversationId],
    queryFn: () => getConversationWithMessages(conversationId!),
    enabled: !!conversationId,
  });
}

/**
 * Hook to start AI dialog
 */
export function useStartDialog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StartDialogRequest) => startDialog(data),
    onSuccess: (_, variables) => {
      // Invalidate task conversations cache
      queryClient.invalidateQueries({
        queryKey: ["task-conversations", variables.task_id],
      });
    },
  });
}

/**
 * Hook to send message to AI
 */
export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => sendMessage(conversationId, content),
    onSuccess: (_, variables) => {
      // Invalidate conversation messages cache
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages", variables.conversationId],
      });
    },
  });
}

/**
 * Hook to delete AI conversation
 */
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onSuccess: () => {
      // Invalidate all conversation caches
      queryClient.invalidateQueries({
        queryKey: ["smart-validations"],
      });
      queryClient.invalidateQueries({
        queryKey: ["task-conversations"],
      });
    },
  });
}

/**
 * Hook to get all AI conversations for a task
 */
export function useTaskConversations(taskId: string | undefined, conversationType?: string) {
  return useQuery({
    queryKey: ["task-conversations", taskId, conversationType],
    queryFn: () => getTaskConversations(taskId!, conversationType),
    enabled: !!taskId,
  });
}

// ============================================================================
// SMART Wizard Hooks
// ============================================================================

/**
 * Hook to analyze task for SMART (Step 1)
 */
export function useSmartAnalyze() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SMARTAnalyzeRequest) => smartAnalyze(data),
    onSuccess: (_result, variables) => {
      // Invalidate task conversations to show wizard conversation
      queryClient.invalidateQueries({
        queryKey: ["task-conversations", variables.task_id],
      });
    },
  });
}

/**
 * Hook to refine task with SMART proposal (Step 2)
 */
export function useSmartRefine() {
  return useMutation({
    mutationFn: (data: SMARTRefineRequest) => smartRefine(data),
  });
}

/**
 * Hook to apply SMART proposal (Step 3)
 */
export function useSmartApply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SMARTApplyRequest) => smartApply(data),
    onSuccess: (result) => {
      // Invalidate task cache to refresh with new title/description
      queryClient.invalidateQueries({
        queryKey: ["task", result.task_id],
      });
      // Invalidate tasks list
      queryClient.invalidateQueries({
        queryKey: ["tasks"],
      });
      // Invalidate checklists if DoD was created
      // Query key format: ["checklists", "list", "task", taskId]
      if (result.checklist_id) {
        queryClient.invalidateQueries({
          predicate: (query) =>
            query.queryKey[0] === "checklists" &&
            query.queryKey[3] === result.task_id,
        });
      }
      // Invalidate conversations
      queryClient.invalidateQueries({
        predicate: (query) =>
          query.queryKey[0] === "task-conversations" &&
          query.queryKey[1] === result.task_id,
      });
    },
  });
}

// ============================================================================
// Risk Analysis Hooks
// ============================================================================

/**
 * Hook to analyze task risks
 */
export function useAnalyzeRisks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RiskAnalysisRequest) => analyzeRisks(data),
    onSuccess: (_, variables) => {
      // Invalidate task conversations
      queryClient.invalidateQueries({
        queryKey: ["task-conversations", variables.task_id],
      });
    },
  });
}

// ============================================================================
// AI Comment Hooks
// ============================================================================

/**
 * Hook to generate AI comment (preview only)
 */
export function useGenerateComment() {
  return useMutation({
    mutationFn: ({ taskId, commentType }: { taskId: string; commentType: AICommentType }) =>
      generateComment(taskId, commentType),
  });
}

/**
 * Hook to generate and save AI comment to task
 */
export function useAutoComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, commentType }: { taskId: string; commentType: AICommentType }) =>
      autoComment(taskId, commentType),
    onSuccess: (_, variables) => {
      // Invalidate task comments
      queryClient.invalidateQueries({
        queryKey: ["comments", variables.taskId],
      });
      // Invalidate task conversations
      queryClient.invalidateQueries({
        queryKey: ["task-conversations", variables.taskId],
      });
    },
  });
}

// ============================================================================
// Progress Review Hooks
// ============================================================================

/**
 * Hook to review task progress
 */
export function useReviewProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProgressReviewRequest) => reviewProgress(data),
    onSuccess: (_, variables) => {
      // Invalidate task conversations
      queryClient.invalidateQueries({
        queryKey: ["task-conversations", variables.task_id],
      });
    },
  });
}

// ============================================================================
// Dialog Completion Hook
// ============================================================================

/**
 * Hook to complete dialog and optionally apply changes
 */
export function useCompleteDialog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, applyChanges }: { conversationId: string; applyChanges?: boolean }) =>
      completeDialog(conversationId, applyChanges),
    onSuccess: () => {
      // Invalidate conversations to refresh status
      queryClient.invalidateQueries({
        queryKey: ["conversation-messages"],
      });
      queryClient.invalidateQueries({
        queryKey: ["task-conversations"],
      });
    },
  });
}
