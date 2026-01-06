/**
 * SmartTask360 — Comments API
 */

import { api } from "../../shared/api";
import type { Comment, CommentCreate, CommentUpdate, Reaction, ReactionSummary } from "./types";

export async function getTaskComments(taskId: string): Promise<Comment[]> {
  const { data } = await api.get<Comment[]>(`/comments/tasks/${taskId}/comments`);
  return data;
}

export async function createComment(data: CommentCreate): Promise<Comment> {
  const { data: comment } = await api.post<Comment>("/comments/", data);
  return comment;
}

export async function updateComment(commentId: string, data: CommentUpdate): Promise<Comment> {
  const { data: comment } = await api.patch<Comment>(`/comments/${commentId}`, data);
  return comment;
}

export async function deleteComment(commentId: string): Promise<void> {
  await api.delete(`/comments/${commentId}`);
}

// Reaction API functions
export async function getCommentReactions(commentId: string): Promise<ReactionSummary[]> {
  const { data } = await api.get<ReactionSummary[]>(`/comments/${commentId}/reactions`);
  return data;
}

export async function toggleReaction(commentId: string, emoji: string): Promise<Reaction | null> {
  const { data } = await api.post<Reaction | null>(`/comments/${commentId}/reactions`, { emoji });
  return data;
}

export async function removeReaction(commentId: string, emoji: string): Promise<void> {
  await api.delete(`/comments/${commentId}/reactions/${emoji}`);
}

// Mark all comments on a task as read
export async function markTaskCommentsAsRead(taskId: string): Promise<{ marked_count: number }> {
  const { data } = await api.post<{ marked_count: number }>(`/comments/tasks/${taskId}/mark-read`);
  return data;
}
