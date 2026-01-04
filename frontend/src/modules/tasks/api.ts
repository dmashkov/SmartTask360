import { api } from "../../shared/api";
import type {
  Task,
  TaskCreate,
  TaskUpdate,
  TaskAccept,
  TaskReject,
  TaskStatusChange,
  AvailableTransitions,
  TaskFilters,
  PaginationParams,
  ImportResult,
} from "./types";

// Get all tasks with filters and pagination
export async function getTasks(
  filters?: TaskFilters,
  pagination?: PaginationParams
): Promise<Task[]> {
  const params = new URLSearchParams();

  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v));
        } else {
          params.append(key, String(value));
        }
      }
    });
  }

  if (pagination) {
    if (pagination.page) params.append("skip", String((pagination.page - 1) * (pagination.per_page || 20)));
    if (pagination.per_page) params.append("limit", String(pagination.per_page));
  }

  const response = await api.get<Task[]>(`/tasks/?${params.toString()}`);
  return response.data;
}

// Get single task by ID
export async function getTask(taskId: string): Promise<Task> {
  const response = await api.get<Task>(`/tasks/${taskId}`);
  return response.data;
}

// Create new task
export async function createTask(data: TaskCreate): Promise<Task> {
  const response = await api.post<Task>("/tasks/", data);
  return response.data;
}

// Update task
export async function updateTask(taskId: string, data: TaskUpdate): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${taskId}`, data);
  return response.data;
}

// Delete task (soft delete)
export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

// Get task children (subtasks)
export async function getTaskChildren(taskId: string): Promise<Task[]> {
  const response = await api.get<Task[]>(`/tasks/${taskId}/children`);
  return response.data;
}

// Get task descendants (all nested)
export async function getTaskDescendants(taskId: string): Promise<Task[]> {
  const response = await api.get<Task[]>(`/tasks/${taskId}/descendants`);
  return response.data;
}

// Get task ancestors (path to root)
export async function getTaskAncestors(taskId: string): Promise<Task[]> {
  const response = await api.get<Task[]>(`/tasks/${taskId}/ancestors`);
  return response.data;
}

// Accept task
export async function acceptTask(taskId: string, data?: TaskAccept): Promise<Task> {
  const response = await api.post<Task>(`/tasks/${taskId}/accept`, data || {});
  return response.data;
}

// Reject task
export async function rejectTask(taskId: string, data: TaskReject): Promise<Task> {
  const response = await api.post<Task>(`/tasks/${taskId}/reject`, data);
  return response.data;
}

// Change task status
export async function changeTaskStatus(
  taskId: string,
  data: TaskStatusChange
): Promise<Task> {
  const response = await api.post<Task>(`/tasks/${taskId}/status`, data);
  return response.data;
}

// Get available transitions
export async function getAvailableTransitions(
  taskId: string
): Promise<AvailableTransitions> {
  const response = await api.get<AvailableTransitions>(
    `/tasks/${taskId}/available-transitions`
  );
  return response.data;
}

// Add watcher
export async function addWatcher(taskId: string, userId: string): Promise<void> {
  await api.post(`/tasks/${taskId}/watchers`, { user_id: userId });
}

// Remove watcher
export async function removeWatcher(taskId: string, userId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/watchers/${userId}`);
}

// Get watchers
export async function getWatchers(
  taskId: string
): Promise<Array<{ id: string; name: string; email: string }>> {
  const response = await api.get<Array<{ id: string; name: string; email: string }>>(
    `/tasks/${taskId}/watchers`
  );
  return response.data;
}

// Add participant
export async function addParticipant(taskId: string, userId: string): Promise<void> {
  await api.post(`/tasks/${taskId}/participants`, { user_id: userId });
}

// Remove participant
export async function removeParticipant(taskId: string, userId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/participants/${userId}`);
}

// Get participants
export async function getParticipants(
  taskId: string
): Promise<Array<{ id: string; name: string; email: string }>> {
  const response = await api.get<Array<{ id: string; name: string; email: string }>>(
    `/tasks/${taskId}/participants`
  );
  return response.data;
}

// Add tag to task
export async function addTaskTag(taskId: string, tagId: string): Promise<void> {
  await api.post(`/tasks/${taskId}/tags/${tagId}`);
}

// Remove tag from task
export async function removeTaskTag(taskId: string, tagId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/tags/${tagId}`);
}

// Get task tags
export async function getTaskTags(
  taskId: string
): Promise<Array<{ id: string; name: string; color: string }>> {
  const response = await api.get<Array<{ id: string; name: string; color: string }>>(
    `/tasks/${taskId}/tags`
  );
  return response.data;
}

// ===== Excel Export/Import =====

// Export tasks to Excel file
export async function exportTasksExcel(filters?: TaskFilters): Promise<Blob> {
  const params = new URLSearchParams();

  if (filters) {
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach((s) => params.append("status", s));
      } else {
        params.append("status", filters.status);
      }
    }
    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        filters.priority.forEach((p) => params.append("priority", p));
      } else {
        params.append("priority", filters.priority);
      }
    }
    if (filters.search) params.append("search", filters.search);
    if (filters.project_id) params.append("project_id", filters.project_id);
    if (filters.department_id) params.append("department_id", filters.department_id);
  }

  const response = await api.get(`/tasks/export/excel?${params.toString()}`, {
    responseType: "blob",
  });
  return response.data;
}

// Get import template
export async function getImportTemplate(): Promise<Blob> {
  const response = await api.get("/tasks/export/template", {
    responseType: "blob",
  });
  return response.data;
}

// Import tasks from Excel file
export async function importTasksExcel(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ImportResult>("/tasks/import/excel", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}
