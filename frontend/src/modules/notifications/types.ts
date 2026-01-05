/**
 * SmartTask360 — Notification types
 */

export type NotificationType =
  | "task_assigned"
  | "task_status_changed"
  | "task_commented"
  | "task_due_soon"
  | "task_overdue"
  | "task_mentioned"
  | "project_invited"
  | "project_role_changed"
  | "system";

export type NotificationPriority = "low" | "normal" | "high";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  entity_type: string | null;
  entity_id: string | null;
  actor_id: string | null;
  is_read: boolean;
  priority: NotificationPriority;
  group_key: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
  read_at: string | null;
}

export interface NotificationWithActor extends Notification {
  actor_name: string | null;
  actor_email: string | null;
}

export interface UnreadCount {
  total: number;
  by_type: Record<string, number>;
  high_priority: number;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  email_frequency: "instant" | "daily" | "weekly";
  push_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  muted_types: NotificationType[];
  created_at: string;
  updated_at: string;
}

export interface NotificationSettingsUpdate {
  email_enabled?: boolean;
  email_frequency?: "instant" | "daily" | "weekly";
  push_enabled?: boolean;
  in_app_enabled?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  muted_types?: NotificationType[];
}
