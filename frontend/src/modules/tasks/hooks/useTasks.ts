import { useQuery } from "@tanstack/react-query";
import { getTasks, getTaskChildren, getTaskDescendants, getTaskAncestors } from "../api";
import type { TaskFilters, PaginationParams } from "../types";

export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters?: TaskFilters, pagination?: PaginationParams) =>
    [...taskKeys.lists(), { filters, pagination }] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
  children: (id: string) => [...taskKeys.detail(id), "children"] as const,
  descendants: (id: string) => [...taskKeys.detail(id), "descendants"] as const,
  ancestors: (id: string) => [...taskKeys.detail(id), "ancestors"] as const,
};

export function useTasks(filters?: TaskFilters, pagination?: PaginationParams) {
  return useQuery({
    queryKey: taskKeys.list(filters, pagination),
    queryFn: () => getTasks(filters, pagination),
  });
}

export function useTaskChildren(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.children(taskId),
    queryFn: () => getTaskChildren(taskId),
    enabled,
  });
}

export function useTaskDescendants(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.descendants(taskId),
    queryFn: () => getTaskDescendants(taskId),
    enabled,
  });
}

export function useTaskAncestors(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.ancestors(taskId),
    queryFn: () => getTaskAncestors(taskId),
    enabled,
  });
}
