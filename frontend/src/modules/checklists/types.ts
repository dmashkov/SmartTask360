/**
 * SmartTask360 — Checklists Types
 *
 * Multiple checklists per task with hierarchical items.
 */

// ============================================================================
// Checklist
// ============================================================================

export interface Checklist {
  id: string;
  task_id: string;
  title: string;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ChecklistCreate {
  task_id: string;
  title: string;
  position?: number;
}

export interface ChecklistUpdate {
  title?: string;
  position?: number;
}

// ============================================================================
// Checklist Item
// ============================================================================

export interface ChecklistItem {
  id: string;
  checklist_id: string;
  parent_id: string | null;
  content: string;
  is_completed: boolean;
  position: number;
  depth: number;
  path: string;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  children?: ChecklistItem[];
}

export interface ChecklistItemCreate {
  checklist_id: string;
  content: string;
  parent_id?: string | null;
  position?: number;
}

export interface ChecklistItemUpdate {
  content?: string;
  position?: number;
}

export interface ChecklistItemToggle {
  is_completed: boolean;
}

export interface ChecklistItemMove {
  new_parent_id?: string | null;
  new_position?: number;
}

// ============================================================================
// Responses with nested data
// ============================================================================

export interface ChecklistWithItems extends Checklist {
  items: ChecklistItem[];
}

export interface ChecklistStats {
  checklist_id: string;
  total_items: number;
  completed_items: number;
  completion_percentage: number;
}

// ============================================================================
// Aggregated response for task
// ============================================================================

export interface TaskChecklistsResponse {
  checklists: ChecklistWithItems[];
  total_items: number;
  completed_items: number;
  completion_percentage: number;
}
