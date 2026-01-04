/**
 * SmartTask360 — Project types
 */

// ============================================================
// Enums
// ============================================================

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

export type ProjectMemberRole = "owner" | "admin" | "member" | "viewer";

// ============================================================
// Project Types
// ============================================================

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string | null;
  status: ProjectStatus;
  owner_id: string;
  department_id: string | null;
  start_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectStats {
  total_tasks: number;
  tasks_by_status: Record<string, number>;
  completed_tasks: number;
  completion_percentage: number;
  overdue_tasks: number;
  total_boards: number;
  total_members: number;
}

export interface ProjectWithStats extends Project {
  stats: ProjectStats;
}

export interface ProjectListItem {
  id: string;
  name: string;
  code: string;
  status: ProjectStatus;
  owner_id: string;
  due_date: string | null;
  created_at: string;
  task_count: number;
  member_count: number;
}

// ============================================================
// Project Member Types
// ============================================================

export interface ProjectMember {
  project_id: string;
  user_id: string;
  role: ProjectMemberRole;
  joined_at: string;
}

export interface ProjectMemberWithUser extends ProjectMember {
  user_email: string;
  user_name: string | null;
}

// ============================================================
// Create/Update Types
// ============================================================

export interface ProjectCreate {
  name: string;
  code: string;
  description?: string | null;
  status?: ProjectStatus;
  department_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  settings?: Record<string, unknown> | null;
}

export interface ProjectUpdate {
  name?: string;
  code?: string;
  description?: string | null;
  status?: ProjectStatus;
  department_id?: string | null;
  start_date?: string | null;
  due_date?: string | null;
  settings?: Record<string, unknown> | null;
}

export interface ProjectMemberCreate {
  user_id: string;
  role?: ProjectMemberRole;
}

export interface ProjectMemberUpdate {
  role: ProjectMemberRole;
}

// ============================================================
// Filter Types
// ============================================================

export interface ProjectFilters {
  status?: ProjectStatus;
  owner_id?: string;
  department_id?: string;
  search?: string;
  include_archived?: boolean;
  my_projects?: boolean;
}
