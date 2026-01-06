/**
 * SmartTask360 — Tag types
 */

export interface Tag {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export interface TagCreate {
  name: string;
  color?: string;
}

export interface TagUpdate {
  name?: string;
  color?: string;
  is_active?: boolean;
}

export interface TagAssign {
  tag_ids: string[];
}
