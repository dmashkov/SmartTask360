/**
 * SmartTask360 — Comments API
 */

import { api } from "../../shared/api";
import type { Comment, CommentCreate, CommentUpdate } from "./types";

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
