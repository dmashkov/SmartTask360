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
  moveChecklistItem,
} from "../api";
import type {
  ChecklistCreate,
  ChecklistUpdate,
  ChecklistItemCreate,
  ChecklistItemUpdate,
  ChecklistItemToggle,
  ChecklistItemMove,
  TaskChecklistsResponse,
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

/**
 * Move/reorder a checklist item with optimistic updates
 */
export function useMoveChecklistItem(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      data,
    }: {
      itemId: string;
      data: ChecklistItemMove;
      checklistId: string;
      oldIndex: number;
      newIndex: number;
    }) => moveChecklistItem(itemId, data),

    // Optimistic update: immediately reorder items in cache
    onMutate: async ({ itemId, checklistId, newIndex }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TaskChecklistsResponse>(
        checklistKeys.taskChecklists(taskId)
      );

      // Optimistically update to the new value
      if (previousData) {
        const newChecklists = previousData.checklists.map((checklist) => {
          if (checklist.id !== checklistId) return checklist;

          // Get root items (no parent) sorted by position
          const rootItems = checklist.items
            .filter((item) => !item.parent_id)
            .sort((a, b) => a.position - b.position);

          // Reorder items
          const movedItem = rootItems.find((item) => item.id === itemId);
          if (!movedItem) return checklist;

          const itemsWithoutMoved = rootItems.filter((item) => item.id !== itemId);
          itemsWithoutMoved.splice(newIndex, 0, movedItem);

          // Update positions
          const reorderedItems = itemsWithoutMoved.map((item, idx) => ({
            ...item,
            position: idx,
          }));

          // Merge with child items (if any)
          const childItems = checklist.items.filter((item) => item.parent_id);

          return {
            ...checklist,
            items: [...reorderedItems, ...childItems],
          };
        });

        queryClient.setQueryData<TaskChecklistsResponse>(
          checklistKeys.taskChecklists(taskId),
          {
            ...previousData,
            checklists: newChecklists,
          }
        );
      }

      return { previousData };
    },

    // If mutation fails, rollback to previous value
    onError: (_err, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          checklistKeys.taskChecklists(taskId),
          context.previousData
        );
      }
    },

    // Always refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: checklistKeys.taskChecklists(taskId),
      });
    },
  });
}
