/**
 * SmartTask360 — Task History types
 */

export interface TaskHistoryEntry {
  id: string;
  task_id: string;
  changed_by_id: string | null;
  action: string;
  field_name: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  comment: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
}

export type HistoryAction =
  | "created"
  | "updated"
  | "status_changed"
  | "assigned"
  | "accepted"
  | "rejected"
  | "completed"
  | "commented"
  | "deleted";
