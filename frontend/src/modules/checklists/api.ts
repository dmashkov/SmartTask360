/**
 * SmartTask360 — Checklists API
 */

import { api } from "../../shared/api";
import type {
  Checklist,
  ChecklistCreate,
  ChecklistUpdate,
  ChecklistWithItems,
  ChecklistStats,
  ChecklistItem,
  ChecklistItemCreate,
  ChecklistItemUpdate,
  ChecklistItemToggle,
  ChecklistItemMove,
  TaskChecklistsResponse,
} from "./types";

const BASE_URL = "/checklists";

// ============================================================================
// Checklists
// ============================================================================

/**
 * Get all checklists for a task with items
 */
export async function getTaskChecklists(
  taskId: string
): Promise<TaskChecklistsResponse> {
  const { data } = await api.get<ChecklistWithItems[]>(
    `${BASE_URL}/tasks/${taskId}/checklists`
  );

  // Calculate aggregated stats
  let totalItems = 0;
  let completedItems = 0;

  data.forEach((checklist) => {
    checklist.items.forEach((item) => {
      totalItems++;
      if (item.is_completed) completedItems++;
    });
  });

  return {
    checklists: data,
    total_items: totalItems,
    completed_items: completedItems,
    completion_percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
  };
}

/**
 * Get checklist with items
 */
export async function getChecklistWithItems(
  checklistId: string
): Promise<ChecklistWithItems> {
  const { data } = await api.get<ChecklistWithItems>(
    `${BASE_URL}/${checklistId}/with-items`
  );
  return data;
}

/**
 * Get checklist stats
 */
export async function getChecklistStats(
  checklistId: string
): Promise<ChecklistStats> {
  const { data } = await api.get<ChecklistStats>(
    `${BASE_URL}/${checklistId}/stats`
  );
  return data;
}

/**
 * Create a new checklist
 */
export async function createChecklist(
  checklistData: ChecklistCreate
): Promise<Checklist> {
  const { data } = await api.post<Checklist>(BASE_URL, checklistData);
  return data;
}

/**
 * Update a checklist
 */
export async function updateChecklist(
  checklistId: string,
  checklistData: ChecklistUpdate
): Promise<Checklist> {
  const { data } = await api.patch<Checklist>(
    `${BASE_URL}/${checklistId}`,
    checklistData
  );
  return data;
}

/**
 * Delete a checklist
 */
export async function deleteChecklist(checklistId: string): Promise<void> {
  await api.delete(`${BASE_URL}/${checklistId}`);
}

// ============================================================================
// Checklist Items
// ============================================================================

/**
 * Create a new checklist item
 */
export async function createChecklistItem(
  itemData: ChecklistItemCreate
): Promise<ChecklistItem> {
  const { data } = await api.post<ChecklistItem>(`${BASE_URL}/items`, itemData);
  return data;
}

/**
 * Toggle item completion
 */
export async function toggleChecklistItem(
  itemId: string,
  toggleData: ChecklistItemToggle
): Promise<ChecklistItem> {
  const { data } = await api.post<ChecklistItem>(
    `${BASE_URL}/items/${itemId}/toggle`,
    toggleData
  );
  return data;
}

/**
 * Update a checklist item
 */
export async function updateChecklistItem(
  itemId: string,
  itemData: ChecklistItemUpdate
): Promise<ChecklistItem> {
  const { data } = await api.patch<ChecklistItem>(
    `${BASE_URL}/items/${itemId}`,
    itemData
  );
  return data;
}

/**
 * Delete a checklist item
 */
export async function deleteChecklistItem(itemId: string): Promise<void> {
  await api.delete(`${BASE_URL}/items/${itemId}`);
}

/**
 * Move a checklist item (reorder or change parent)
 */
export async function moveChecklistItem(
  itemId: string,
  moveData: ChecklistItemMove
): Promise<ChecklistItem> {
  const { data } = await api.post<ChecklistItem>(
    `${BASE_URL}/items/${itemId}/move`,
    moveData
  );
  return data;
}
