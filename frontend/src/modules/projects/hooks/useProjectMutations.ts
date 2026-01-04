/**
 * SmartTask360 — Projects mutation hooks
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProject,
  updateProject,
  deleteProject,
  addProjectMember,
  updateProjectMember,
  removeProjectMember,
} from "../api";
import { projectKeys } from "./useProjects";
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectMember,
  ProjectMemberCreate,
  ProjectMemberUpdate,
} from "../types";

// Create project
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation<Project, Error, ProjectCreate>({
    mutationFn: createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Update project
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation<
    Project,
    Error,
    { projectId: string; data: ProjectUpdate }
  >({
    mutationFn: ({ projectId, data }) => updateProject(projectId, data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(project.id) });
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Delete project
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
}

// Add project member
export function useAddProjectMember() {
  const queryClient = useQueryClient();

  return useMutation<
    ProjectMember,
    Error,
    { projectId: string; data: ProjectMemberCreate }
  >({
    mutationFn: ({ projectId, data }) => addProjectMember(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}

// Update project member role
export function useUpdateProjectMember() {
  const queryClient = useQueryClient();

  return useMutation<
    ProjectMember,
    Error,
    { projectId: string; userId: string; data: ProjectMemberUpdate }
  >({
    mutationFn: ({ projectId, userId, data }) =>
      updateProjectMember(projectId, userId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
    },
  });
}

// Remove project member
export function useRemoveProjectMember() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { projectId: string; userId: string }>({
    mutationFn: ({ projectId, userId }) => removeProjectMember(projectId, userId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
    },
  });
}
