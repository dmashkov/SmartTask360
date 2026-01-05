/**
 * SmartTask360 — Comments hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTaskComments, createComment, updateComment, deleteComment } from "../api";
import type { CommentCreate, CommentUpdate } from "../types";

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: ["comments", taskId],
    queryFn: () => getTaskComments(taskId),
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CommentCreate) => createComment(data),
    onSuccess: (_data, variables) => {
      // Invalidate comments cache
      queryClient.invalidateQueries({ queryKey: ["comments", variables.task_id] });
      // Invalidate task history cache (comment creates history entry)
      queryClient.invalidateQueries({ queryKey: ["task-history", variables.task_id] });
    },
  });
}

export function useUpdateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ commentId, data }: { commentId: string; data: CommentUpdate }) =>
      updateComment(commentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", taskId] });
    },
  });
}
