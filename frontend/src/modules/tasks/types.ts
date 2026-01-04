// Task status enum (matches backend TaskStatus)
export type TaskStatus =
  | "draft"
  | "new"
  | "assigned"
  | "in_progress"
  | "on_hold"
  | "in_review"
  | "done"
  | "cancelled";

// Task priority enum (matches backend TaskPriority)
export type TaskPriority = "low" | "medium" | "high" | "critical";

// Rejection reason enum
export type RejectionReason =
  | "unclear"
  | "no_resources"
  | "unrealistic_deadline"
  | "conflict"
  | "wrong_assignee"
  | "other";

// Task interface matching backend TaskResponse
export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  // author_id - who physically created the task (immutable)
  author_id: string;
  // creator_id - on whose behalf the task was created (can be changed)
  creator_id: string;
  // assignee_id - who will execute the task (can be changed)
  assignee_id: string | null;
  parent_id: string | null;
  path: string;
  depth: number;
  department_id: string | null;
  project_id: string | null;
  workflow_template_id: string | null;
  source_document_id: string | null;
  source_quote: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  is_milestone: boolean;
  is_deleted: boolean;
  estimated_hours: number | null;
  actual_hours: number | null;
  accepted_at: string | null;
  acceptance_deadline: string | null;
  rejection_reason: RejectionReason | null;
  rejection_comment: string | null;
  smart_score: Record<string, unknown> | null;
  smart_validated_at: string | null;
  smart_is_valid: boolean | null;
  children_count: number;
  created_at: string;
  updated_at: string;
}

// Extended task with relations
export interface TaskWithRelations extends Task {
  creator?: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string } | null;
  tags?: Array<{ id: string; name: string; color: string }>;
  subtasks_count?: number;
  comments_count?: number;
  checklists_progress?: { total: number; completed: number };
}

// Create task request
export interface TaskCreate {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  // creator_id - on whose behalf (defaults to current user)
  creator_id?: string | null;
  // assignee_id - who will execute (defaults to creator_id)
  assignee_id?: string | null;
  parent_id?: string | null;
  department_id?: string | null;
  project_id?: string | null;
  workflow_template_id?: string | null;
  source_document_id?: string | null;
  source_quote?: string | null;
  due_date?: string | null;
  is_milestone?: boolean;
  estimated_hours?: number | null;
  acceptance_deadline?: string | null;
}

// Update task request
export interface TaskUpdate {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  // creator_id can be changed
  creator_id?: string | null;
  assignee_id?: string | null;
  parent_id?: string | null;
  department_id?: string | null;
  project_id?: string | null;
  workflow_template_id?: string | null;
  source_document_id?: string | null;
  source_quote?: string | null;
  due_date?: string | null;
  is_milestone?: boolean;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  acceptance_deadline?: string | null;
}

// Task accept request
export interface TaskAccept {
  comment?: string | null;
}

// Task reject request
export interface TaskReject {
  reason: RejectionReason;
  comment: string;
}

// Task status change request
export interface TaskStatusChange {
  status: TaskStatus;
  comment?: string | null;
}

// Available transitions response
export interface AvailableTransitions {
  current_status: string;
  available_statuses: string[];
}

// Task filters for list queries
export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  assignee_id?: string;
  creator_id?: string;
  parent_id?: string | null;
  department_id?: string;
  project_id?: string;
  is_milestone?: boolean;
  search?: string;
  due_date_from?: string;
  due_date_to?: string;
}

// Pagination params
export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

// Paginated response
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Excel import/export types
export interface ImportErrorDetail {
  row: number;
  field: string;
  message: string;
  value: string | null;
}

export interface ImportResult {
  success: boolean;
  total_rows: number;
  imported: number;
  skipped: number;
  errors: ImportErrorDetail[];
}
