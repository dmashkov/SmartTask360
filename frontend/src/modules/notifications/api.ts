/**
 * SmartTask360 — Notifications API
 */

import { api } from "../../shared/api";
import type {
  NotificationWithActor,
  UnreadCount,
  NotificationSettings,
  NotificationSettingsUpdate,
} from "./types";

const BASE_URL = "/notifications";

/**
 * Get notifications for current user
 */
export async function getNotifications(params?: {
  unread_only?: boolean;
  notification_type?: string;
  entity_type?: string;
  entity_id?: string;
  skip?: number;
  limit?: number;
}): Promise<NotificationWithActor[]> {
  const { data } = await api.get<NotificationWithActor[]>(BASE_URL, { params });
  return data;
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(): Promise<UnreadCount> {
  const { data } = await api.get<UnreadCount>(`${BASE_URL}/unread-count`);
  return data;
}

/**
 * Mark notifications as read
 */
export async function markAsRead(notificationIds: string[]): Promise<{ marked_read: number }> {
  const { data } = await api.post<{ marked_read: number }>(`${BASE_URL}/mark-read`, {
    notification_ids: notificationIds,
  });
  return data;
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(params?: {
  type?: string;
  entity_type?: string;
  entity_id?: string;
}): Promise<{ marked_read: number }> {
  const { data } = await api.post<{ marked_read: number }>(`${BASE_URL}/mark-all-read`, params || {});
  return data;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  await api.delete(`${BASE_URL}/${notificationId}`);
}

/**
 * Get notification settings
 */
export async function getSettings(): Promise<NotificationSettings> {
  const { data } = await api.get<NotificationSettings>(`${BASE_URL}/settings/me`);
  return data;
}

/**
 * Update notification settings
 */
export async function updateSettings(
  settings: NotificationSettingsUpdate
): Promise<NotificationSettings> {
  const { data } = await api.patch<NotificationSettings>(`${BASE_URL}/settings/me`, settings);
  return data;
}
