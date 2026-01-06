/**
 * SmartTask360 — Tags React Query hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTags,
  getTaskTags,
  createTag,
  updateTag,
  deleteTag,
  assignTagsToTask,
  addTagToTask,
  removeTagFromTask,
} from "../api";
import type { TagCreate, TagUpdate } from "../types";

// Get all tags
export function useTags(activeOnly: boolean = true) {
  return useQuery({
    queryKey: ["tags", { activeOnly }],
    queryFn: () => getTags(activeOnly),
  });
}

// Get task tags
export function useTaskTags(taskId: string) {
  return useQuery({
    queryKey: ["task-tags", taskId],
    queryFn: () => getTaskTags(taskId),
    enabled: !!taskId,
  });
}

// Create tag
export function useCreateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TagCreate) => createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

// Update tag
export function useUpdateTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, data }: { tagId: string; data: TagUpdate }) =>
      updateTag(tagId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

// Delete tag
export function useDeleteTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tagId: string) => deleteTag(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

// Assign tags to task
export function useAssignTagsToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, tagIds }: { taskId: string; tagIds: string[] }) =>
      assignTagsToTask(taskId, tagIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-tags", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", variables.taskId] });
    },
  });
}

// Add single tag to task
export function useAddTagToTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      addTagToTask(taskId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-tags", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Remove tag from task
export function useRemoveTagFromTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, tagId }: { taskId: string; tagId: string }) =>
      removeTagFromTask(taskId, tagId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task-tags", variables.taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
