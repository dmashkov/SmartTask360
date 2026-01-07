export type BoardMemberRole = "viewer" | "member" | "admin";

export interface Board {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  project_id?: string | null;
  department_id?: string | null;
  workflow_template_id?: string | null;
  is_private: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  order_index: number;
  color: string | null;
  wip_limit: number;
  mapped_status: string | null;
  is_collapsed: boolean;
  task_count: number;
  created_at: string;
  updated_at: string;
}

// Tag brief for board tasks
export interface TagBrief {
  id: string;
  name: string;
  color: string;
}

// Task on board with details from backend
export interface BoardTaskWithDetails {
  id: string;
  board_id: string;
  task_id: string;
  column_id: string;
  order_index: number;
  added_at: string;
  moved_at: string;
  task_title: string;
  task_status: string;
  task_priority: string;
  task_assignee_id: string | null;
  task_due_date: string | null;
  // Tags
  task_tags: TagBrief[];
  // Comment indicators
  total_comments_count: number;
  unread_comments_count: number;
  unread_mentions_count: number;
}

export interface BoardMemberWithDetails {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardMemberRole;
  added_at: string;
  user_name: string;
  user_email: string;
}

// Full board response from GET /boards/{id}
export interface BoardFull extends Board {
  columns: BoardColumn[];
  tasks: BoardTaskWithDetails[];
  members: BoardMemberWithDetails[];
}

// Legacy types for compatibility
export interface BoardTask {
  id: string;
  board_id: string;
  task_id: string;
  column_id: string;
  position: number;
  added_at: string;
}

export interface BoardMember {
  id: string;
  board_id: string;
  user_id: string;
  role: BoardMemberRole;
  added_at: string;
}

export interface BoardColumnWithTasks extends BoardColumn {
  tasks: BoardTaskWithDetails[];
}

export interface BoardCreate {
  name: string;
  description?: string | null;
  project_id?: string | null;
  department_id?: string | null;
  workflow_template_id?: string | null;
  template?: "basic" | "agile" | "approval";
}

export interface BoardUpdate {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}

export interface ColumnCreate {
  name: string;
  description?: string | null;
  color?: string | null;
  wip_limit?: number | null;
  mapped_status?: string | null;
}

export interface ColumnUpdate {
  name?: string;
  description?: string | null;
  color?: string | null;
  wip_limit?: number | null;
  mapped_status?: string | null;
  is_active?: boolean;
}

export interface MoveTaskRequest {
  column_id: string;
  position: number;
}

// Kanban board filters
export interface KanbanFilters {
  search?: string;
  priority?: string;
  assignee_id?: string;
  tag_ids?: string[];
}
