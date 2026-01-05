/**
 * SmartTask360 — User Views Types
 */

import type { TaskFilters } from "../tasks";

export interface UserView {
  id: string;
  user_id: string;
  name: string;
  filters: TaskFilters;
  view_type: "task" | "board" | "project";
  is_default: boolean;
  sort_order: number;
  icon: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserViewCreate {
  name: string;
  filters: TaskFilters;
  view_type?: "task" | "board" | "project";
  is_default?: boolean;
  icon?: string | null;
  color?: string | null;
}

export interface UserViewUpdate {
  name?: string;
  filters?: TaskFilters;
  is_default?: boolean;
  sort_order?: number;
  icon?: string | null;
  color?: string | null;
}
