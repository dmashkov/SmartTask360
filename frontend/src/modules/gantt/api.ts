/**
 * Gantt Chart API Functions
 */

import { api } from "@/shared/api/client";
import type { Task } from "../tasks/types";
import type {
  BulkBaselineCreate,
  GanttDateUpdate,
  GanttResponse,
  TaskBaseline,
  TaskDependency,
  TaskDependencyCreate,
} from "./types";

// ============== Gantt Data ==============

export async function getGanttData(projectId: string): Promise<GanttResponse> {
  const response = await api.get<GanttResponse>(`/gantt/projects/${projectId}`);
  return response.data;
}

// ============== Dependencies ==============

export async function createDependency(
  data: TaskDependencyCreate
): Promise<TaskDependency> {
  const response = await api.post<TaskDependency>("/gantt/dependencies", data);
  return response.data;
}

export async function deleteDependency(
  predecessorId: string,
  successorId: string
): Promise<void> {
  await api.delete(`/gantt/dependencies/${predecessorId}/${successorId}`);
}

export async function getTaskDependencies(
  taskId: string
): Promise<TaskDependency[]> {
  const response = await api.get<TaskDependency[]>(
    `/gantt/tasks/${taskId}/dependencies`
  );
  return response.data;
}

// ============== Baselines ==============

export async function createBaseline(
  taskId: string,
  baselineName?: string
): Promise<TaskBaseline> {
  const response = await api.post<TaskBaseline>("/gantt/baselines", {
    task_id: taskId,
    baseline_name: baselineName,
  });
  return response.data;
}

export async function createBulkBaselines(
  data: BulkBaselineCreate
): Promise<TaskBaseline[]> {
  const response = await api.post<TaskBaseline[]>("/gantt/baselines/bulk", data);
  return response.data;
}

export async function getTaskBaselines(taskId: string): Promise<TaskBaseline[]> {
  const response = await api.get<TaskBaseline[]>(
    `/gantt/tasks/${taskId}/baselines`
  );
  return response.data;
}

export async function deleteBaseline(baselineId: string): Promise<void> {
  await api.delete(`/gantt/baselines/${baselineId}`);
}

// ============== Task Date Updates ==============

export async function updateTaskDates(
  taskId: string,
  data: GanttDateUpdate
): Promise<Task> {
  const response = await api.patch<Task>(`/gantt/tasks/${taskId}/dates`, data);
  return response.data;
}
