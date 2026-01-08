/**
 * Gantt Chart Types
 */

// Dependency types
export type DependencyType = "FS" | "SS" | "FF" | "SF";

// Task dependency
export interface TaskDependency {
  id: string;
  predecessor_id: string;
  successor_id: string;
  dependency_type: DependencyType;
  lag_days: number;
  created_at: string;
  created_by: string | null;
}

// Brief dependency for Gantt data
export interface TaskDependencyBrief {
  predecessor_id: string;
  dependency_type: DependencyType;
  lag_days: number;
}

// Create dependency request
export interface TaskDependencyCreate {
  predecessor_id: string;
  successor_id: string;
  dependency_type?: DependencyType;
  lag_days?: number;
}

// Task baseline
export interface TaskBaseline {
  id: string;
  task_id: string;
  baseline_number: number;
  baseline_name: string | null;
  planned_start_date: string | null;
  planned_end_date: string | null;
  estimated_hours: number | null;
  created_at: string;
  created_by: string | null;
}

// Create baseline request
export interface TaskBaselineCreate {
  task_id: string;
  baseline_name?: string | null;
}

// Bulk baseline create request
export interface BulkBaselineCreate {
  task_ids: string[];
  baseline_name?: string | null;
}

// Gantt task data
export interface GanttTaskData {
  id: string;
  title: string;
  status: string;
  priority: string;

  // Effective dates for display
  start_date: string | null;
  end_date: string | null;

  // Original fields
  planned_start_date: string | null;
  planned_end_date: string | null;
  due_date: string | null;
  started_at: string | null;
  completed_at: string | null;

  // Task properties
  is_milestone: boolean;
  estimated_hours: number | null;
  progress: number;

  // Hierarchy
  parent_id: string | null;
  depth: number;

  // Dependencies
  dependencies: TaskDependencyBrief[];

  // Critical path
  is_critical: boolean;

  // Assignee
  assignee_id: string | null;
  assignee_name: string | null;
}

// Gantt response
export interface GanttResponse {
  tasks: GanttTaskData[];
  project_id: string;
  project_name: string | null;
  min_date: string | null;
  max_date: string | null;
  critical_path: string[];
}

// Gantt date update
export interface GanttDateUpdate {
  planned_start_date?: string | null;
  planned_end_date?: string | null;
}

// Zoom level for Gantt chart
export type GanttZoomLevel = "day" | "week" | "month";

// Gantt column config
export interface GanttColumnConfig {
  width: number; // pixels per unit (day/week/month)
  format: string; // date format for header
  subFormat?: string; // secondary format (e.g., day of week)
}

// Gantt view state
export interface GanttViewState {
  zoom: GanttZoomLevel;
  scrollLeft: number;
  showCriticalPath: boolean;
  showDependencies: boolean;
  showBaselines: boolean;
  expandedTasks: Set<string>;
}
