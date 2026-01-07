/**
 * SmartTask360 — Projects query hooks
 */

import { useQuery } from "@tanstack/react-query";
import {
  getProjects,
  getProject,
  getProjectByCode,
  getProjectMembers,
  getProjectTasks,
  getProjectBoards,
} from "../api";
import type { ProjectFilters } from "../types";

// Query keys factory
export const projectKeys = {
  all: ["projects"] as const,
  lists: () => [...projectKeys.all, "list"] as const,
  list: (filters?: ProjectFilters) => [...projectKeys.lists(), { filters }] as const,
  details: () => [...projectKeys.all, "detail"] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  byCode: (code: string) => [...projectKeys.all, "code", code] as const,
  members: (id: string) => [...projectKeys.detail(id), "members"] as const,
  tasks: (id: string, status?: string) =>
    [...projectKeys.detail(id), "tasks", { status }] as const,
  boards: (id: string) => [...projectKeys.detail(id), "boards"] as const,
};

// Get list of projects
export function useProjects(filters?: ProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: () => getProjects(filters),
  });
}

// Get single project with stats
export function useProject(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: () => getProject(projectId),
    enabled: enabled && !!projectId,
  });
}

// Get project by code
export function useProjectByCode(code: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.byCode(code),
    queryFn: () => getProjectByCode(code),
    enabled: enabled && !!code,
  });
}

// Get project members
export function useProjectMembers(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.members(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: enabled && !!projectId,
  });
}

// Get project tasks
export function useProjectTasks(
  projectId: string,
  status?: string,
  enabled = true
) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId, status),
    queryFn: () => getProjectTasks(projectId, status),
    enabled: enabled && !!projectId,
    // Always refetch on mount to get fresh kanban positions after navigation
    staleTime: 0,
  });
}

// Get project boards
export function useProjectBoards(projectId: string, enabled = true) {
  return useQuery({
    queryKey: projectKeys.boards(projectId),
    queryFn: () => getProjectBoards(projectId),
    enabled: enabled && !!projectId,
  });
}
