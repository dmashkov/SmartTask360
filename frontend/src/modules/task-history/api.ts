/**
 * SmartTask360 — Task History API
 */

import { api } from "../../shared/api";
import type { TaskHistoryEntry } from "./types";

export async function getTaskHistory(taskId: string): Promise<TaskHistoryEntry[]> {
  const { data } = await api.get<TaskHistoryEntry[]>(`/task-history/tasks/${taskId}/history`);
  return data;
}
