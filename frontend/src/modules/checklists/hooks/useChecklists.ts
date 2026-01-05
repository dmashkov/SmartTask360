/**
 * SmartTask360 — Checklists Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTaskChecklists,
  getChecklistWithItems,
  createChecklist,
  updateChecklist,
  deleteChecklist,
  createChecklistItem,
  toggleChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from "../api";
import type {
  ChecklistCreate,
  ChecklistUpdate,
  ChecklistItemCreate,
  ChecklistItemUpdate,
  ChecklistItemToggle,
} from "../types";

// ============================================================================
// Query Keys
// ============================================================================

export const checklistKeys = {
  all: ["checklists"] as const,
  lists: () => [...checklistKeys.all, "list"] as const,
  taskChecklists: (taskId: string) => [...checklistKeys.lists(), "task", taskId] as const,
  detail: (id: string) => [...checklistKeys.all, "detail", id] as const,
};

// ============================================================================
// Checklist Queries
// ============================================================================

/**
 * Get all checklists for a task with items and stats
 */
export function useTaskChecklists(taskId: string | undefined) {
  return useQuery({
    queryKey: checklistKeys.taskChecklists(taskId ?? ""),
    queryFn: () => getTaskChecklists(taskId!),
    enabled: !!taskId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get single checklist with items
 */
export function useChecklistWithItems(checklistId: string | undefined) {
  return useQuery({
    queryKey: checklistKeys.detail(checklistId ?? ""),
    queryFn: () => getChecklistWithItems(checklistId!),
    enabled: !!checklistId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================================================
// Checklist Mutations
// ============================================================================

/**
 * Create a new checklist
 */
export function useCreateChecklist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChecklistCreate) => createChecklist(data),
    onSuccess: (newChecklist) => {
      // Invalidate task checklists
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(newChecklist.task_id),
      });
    },
  });
}

/**
 * Update a checklist
 */
export function useUpdateChecklist(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ checklistId, data }: { checklistId: string; data: ChecklistUpdate }) =>
      updateChecklist(checklistId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}

/**
 * Delete a checklist
 */
export function useDeleteChecklist(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChecklist,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}

// ============================================================================
// Checklist Item Mutations
// ============================================================================

/**
 * Create a new checklist item
 */
export function useCreateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ChecklistItemCreate) => createChecklistItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}

/**
 * Toggle item completion
 */
export function useToggleChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: ChecklistItemToggle }) =>
      toggleChecklistItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}

/**
 * Update a checklist item
 */
export function useUpdateChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: ChecklistItemUpdate }) =>
      updateChecklistItem(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}

/**
 * Delete a checklist item
 */
export function useDeleteChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteChecklistItem,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}
