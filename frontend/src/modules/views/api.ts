/**
 * SmartTask360 — User Views API
 */

import { api } from "../../shared/api";
import type { UserView, UserViewCreate, UserViewUpdate } from "./types";

const BASE_URL = "/views";

/**
 * Get all user views
 */
export async function getViews(viewType = "task"): Promise<UserView[]> {
  const { data } = await api.get<UserView[]>(BASE_URL, {
    params: { view_type: viewType },
  });
  return data;
}

/**
 * Get default view
 */
export async function getDefaultView(viewType = "task"): Promise<UserView | null> {
  const { data } = await api.get<UserView | null>(`${BASE_URL}/default`, {
    params: { view_type: viewType },
  });
  return data;
}

/**
 * Get view by ID
 */
export async function getView(viewId: string): Promise<UserView> {
  const { data } = await api.get<UserView>(`${BASE_URL}/${viewId}`);
  return data;
}

/**
 * Create a new view
 */
export async function createView(viewData: UserViewCreate): Promise<UserView> {
  const { data } = await api.post<UserView>(BASE_URL, viewData);
  return data;
}

/**
 * Update a view
 */
export async function updateView(
  viewId: string,
  viewData: UserViewUpdate
): Promise<UserView> {
  const { data } = await api.put<UserView>(`${BASE_URL}/${viewId}`, viewData);
  return data;
}

/**
 * Delete a view
 */
export async function deleteView(viewId: string): Promise<void> {
  await api.delete(`${BASE_URL}/${viewId}`);
}

/**
 * Reorder views
 */
export async function reorderViews(viewIds: string[]): Promise<UserView[]> {
  const { data } = await api.post<UserView[]>(`${BASE_URL}/reorder`, {
    view_ids: viewIds,
  });
  return data;
}
