/**
 * SmartTask360 — Tags API functions
 */

import { api } from "../../shared/api";
import type { Tag, TagCreate, TagUpdate, TagAssign } from "./types";

// Get all tags
export async function getTags(activeOnly: boolean = true): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>("/tags/", {
    params: { active_only: activeOnly },
  });
  return data;
}

// Get single tag
export async function getTag(tagId: string): Promise<Tag> {
  const { data } = await api.get<Tag>(`/tags/${tagId}`);
  return data;
}

// Create tag
export async function createTag(tagData: TagCreate): Promise<Tag> {
  const { data } = await api.post<Tag>("/tags/", tagData);
  return data;
}

// Update tag
export async function updateTag(tagId: string, tagData: TagUpdate): Promise<Tag> {
  const { data } = await api.patch<Tag>(`/tags/${tagId}`, tagData);
  return data;
}

// Delete tag (soft delete)
export async function deleteTag(tagId: string): Promise<void> {
  await api.delete(`/tags/${tagId}`);
}

// Get task tags
export async function getTaskTags(taskId: string): Promise<Tag[]> {
  const { data } = await api.get<Tag[]>(`/tags/tasks/${taskId}/tags`);
  return data;
}

// Assign tags to task (replaces existing)
export async function assignTagsToTask(taskId: string, tagIds: string[]): Promise<Tag[]> {
  const payload: TagAssign = { tag_ids: tagIds };
  const { data } = await api.post<Tag[]>(`/tags/tasks/${taskId}/tags`, payload);
  return data;
}

// Add single tag to task
export async function addTagToTask(taskId: string, tagId: string): Promise<void> {
  await api.put(`/tags/tasks/${taskId}/tags/${tagId}`);
}

// Remove tag from task
export async function removeTagFromTask(taskId: string, tagId: string): Promise<void> {
  await api.delete(`/tags/tasks/${taskId}/tags/${tagId}`);
}
