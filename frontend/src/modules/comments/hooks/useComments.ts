/**
 * SmartTask360 — Comments hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { getTaskComments, createComment, updateComment, deleteComment, getCommentReactions, toggleReaction, markTaskCommentsAsRead } from "../api";
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
      // Invalidate documents cache (comment may have attached documents)
      queryClient.invalidateQueries({ queryKey: ["documents", variables.task_id] });
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

// Reaction hooks
export function useCommentReactions(commentId: string) {
  return useQuery({
    queryKey: ["reactions", commentId],
    queryFn: () => getCommentReactions(commentId),
    enabled: !!commentId,
  });
}

export function useToggleReaction(commentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (emoji: string) => toggleReaction(commentId, emoji),
    onSuccess: () => {
      // Invalidate reactions cache for this comment
      queryClient.invalidateQueries({ queryKey: ["reactions", commentId] });
    },
  });
}

/**
 * Hook to mark all comments on a task as read when the comments section is viewed.
 * Call this hook when the Comments tab/section is opened.
 */
export function useMarkCommentsAsRead(taskId: string) {
  const queryClient = useQueryClient();
  const hasMarked = useRef(false);

  useEffect(() => {
    // Only mark once per mount
    if (!taskId || hasMarked.current) return;

    const markAsRead = async () => {
      try {
        await markTaskCommentsAsRead(taskId);
        hasMarked.current = true;

        // Invalidate board cache to update unread indicators on Kanban
        queryClient.invalidateQueries({ queryKey: ["board"] });
        queryClient.invalidateQueries({ queryKey: ["boards"] });
      } catch (error) {
        console.error("Failed to mark comments as read:", error);
      }
    };

    markAsRead();
  }, [taskId, queryClient]);
}
