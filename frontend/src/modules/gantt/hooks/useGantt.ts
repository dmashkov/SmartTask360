/**
 * Gantt Chart React Query Hooks
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createBaseline,
  createBulkBaselines,
  createDependency,
  deleteBaseline,
  deleteDependency,
  getGanttData,
  getTaskBaselines,
  getTaskDependencies,
  updateTaskDates,
} from "../api";
import type {
  BulkBaselineCreate,
  GanttDateUpdate,
  TaskDependencyCreate,
} from "../types";

// Query keys
export const ganttKeys = {
  all: ["gantt"] as const,
  project: (projectId: string) => [...ganttKeys.all, "project", projectId] as const,
  dependencies: (taskId: string) =>
    [...ganttKeys.all, "dependencies", taskId] as const,
  baselines: (taskId: string) => [...ganttKeys.all, "baselines", taskId] as const,
};

// ============== Gantt Data ==============

export function useGanttData(projectId: string | undefined) {
  return useQuery({
    queryKey: ganttKeys.project(projectId ?? ""),
    queryFn: () => getGanttData(projectId!),
    enabled: !!projectId,
    staleTime: 30000, // 30 seconds
  });
}

// ============== Dependencies ==============

export function useTaskDependencies(taskId: string | undefined) {
  return useQuery({
    queryKey: ganttKeys.dependencies(taskId ?? ""),
    queryFn: () => getTaskDependencies(taskId!),
    enabled: !!taskId,
  });
}

export function useCreateDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TaskDependencyCreate) => createDependency(data),
    onSuccess: () => {
      // Invalidate all gantt queries to refresh data
      queryClient.invalidateQueries({ queryKey: ganttKeys.all });
    },
  });
}

export function useDeleteDependency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      predecessorId,
      successorId,
    }: {
      predecessorId: string;
      successorId: string;
    }) => deleteDependency(predecessorId, successorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ganttKeys.all });
    },
  });
}

// ============== Baselines ==============

export function useTaskBaselines(taskId: string | undefined) {
  return useQuery({
    queryKey: ganttKeys.baselines(taskId ?? ""),
    queryFn: () => getTaskBaselines(taskId!),
    enabled: !!taskId,
  });
}

export function useCreateBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      baselineName,
    }: {
      taskId: string;
      baselineName?: string;
    }) => createBaseline(taskId, baselineName),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: ganttKeys.baselines(taskId) });
    },
  });
}

export function useCreateBulkBaselines() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkBaselineCreate) => createBulkBaselines(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ganttKeys.all });
    },
  });
}

export function useDeleteBaseline() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (baselineId: string) => deleteBaseline(baselineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ganttKeys.all });
    },
  });
}

// ============== Task Date Updates ==============

export function useUpdateTaskDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: { taskId: string; data: GanttDateUpdate }) =>
      updateTaskDates(taskId, data),
    onSuccess: () => {
      // Invalidate both gantt and tasks queries
      queryClient.invalidateQueries({ queryKey: ganttKeys.all });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
