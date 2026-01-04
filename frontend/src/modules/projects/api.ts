/**
 * SmartTask360 — Projects API
 */

import { api } from "../../shared/api";
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectWithStats,
  ProjectListItem,
  ProjectMember,
  ProjectMemberCreate,
  ProjectMemberUpdate,
  ProjectFilters,
} from "./types";

// ============================================================
// Project CRUD
// ============================================================

// Get all projects with filters
export async function getProjects(
  filters?: ProjectFilters,
  skip = 0,
  limit = 50
): Promise<ProjectListItem[]> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.status) params.append("status", filters.status);
    if (filters.owner_id) params.append("owner_id", filters.owner_id);
    if (filters.department_id) params.append("department_id", filters.department_id);
    if (filters.search) params.append("search", filters.search);
    if (filters.include_archived) params.append("include_archived", "true");
    if (filters.my_projects !== undefined) {
      params.append("my_projects", String(filters.my_projects));
    }
  }

  params.append("skip", String(skip));
  params.append("limit", String(limit));

  const response = await api.get<ProjectListItem[]>(`/projects?${params.toString()}`);
  return response.data;
}

// Get project by ID with stats
export async function getProject(projectId: string): Promise<ProjectWithStats> {
  const response = await api.get<ProjectWithStats>(`/projects/${projectId}`);
  return response.data;
}

// Get project by code with stats
export async function getProjectByCode(code: string): Promise<ProjectWithStats> {
  const response = await api.get<ProjectWithStats>(`/projects/by-code/${code}`);
  return response.data;
}

// Create new project
export async function createProject(data: ProjectCreate): Promise<Project> {
  const response = await api.post<Project>("/projects", data);
  return response.data;
}

// Update project
export async function updateProject(
  projectId: string,
  data: ProjectUpdate
): Promise<Project> {
  const response = await api.patch<Project>(`/projects/${projectId}`, data);
  return response.data;
}

// Delete project (soft delete)
export async function deleteProject(projectId: string): Promise<void> {
  await api.delete(`/projects/${projectId}`);
}

// ============================================================
// Project Members
// ============================================================

// Get project members
export async function getProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const response = await api.get<ProjectMember[]>(`/projects/${projectId}/members`);
  return response.data;
}

// Add project member
export async function addProjectMember(
  projectId: string,
  data: ProjectMemberCreate
): Promise<ProjectMember> {
  const response = await api.post<ProjectMember>(
    `/projects/${projectId}/members`,
    data
  );
  return response.data;
}

// Update project member role
export async function updateProjectMember(
  projectId: string,
  userId: string,
  data: ProjectMemberUpdate
): Promise<ProjectMember> {
  const response = await api.patch<ProjectMember>(
    `/projects/${projectId}/members/${userId}`,
    data
  );
  return response.data;
}

// Remove project member
export async function removeProjectMember(
  projectId: string,
  userId: string
): Promise<void> {
  await api.delete(`/projects/${projectId}/members/${userId}`);
}

// ============================================================
// Project Tasks & Boards
// ============================================================

interface TaskListResponse {
  items: unknown[];
  total: number;
  skip: number;
  limit: number;
}

// Get project tasks
export async function getProjectTasks(
  projectId: string,
  status?: string,
  skip = 0,
  limit = 50
): Promise<TaskListResponse> {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  params.append("skip", String(skip));
  params.append("limit", String(limit));

  const response = await api.get<TaskListResponse>(
    `/projects/${projectId}/tasks?${params.toString()}`
  );
  return response.data;
}

// Get project boards
export async function getProjectBoards(projectId: string): Promise<unknown[]> {
  const response = await api.get<unknown[]>(`/projects/${projectId}/boards`);
  return response.data;
}
