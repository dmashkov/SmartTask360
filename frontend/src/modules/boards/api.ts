import { api } from "../../shared/api";
import type {
  Board,
  BoardFull,
  BoardColumn,
  BoardTask,
  BoardMember,
  BoardCreate,
  BoardUpdate,
  ColumnCreate,
  ColumnUpdate,
  MoveTaskRequest,
  BoardMemberRole,
} from "./types";

// Board list item from API
export interface BoardListItem {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  is_private: boolean;
  is_archived: boolean;
  column_count: number;
  task_count: number;
  member_count: number;
  created_at: string;
}

// Board CRUD
export async function getBoards(): Promise<BoardListItem[]> {
  const response = await api.get<BoardListItem[]>("/boards");
  return response.data;
}

export async function getBoard(boardId: string): Promise<BoardFull> {
  const response = await api.get<BoardFull>(`/boards/${boardId}`);
  return response.data;
}

export async function createBoard(data: BoardCreate): Promise<Board> {
  const response = await api.post<Board>("/boards", data);
  return response.data;
}

export async function updateBoard(boardId: string, data: BoardUpdate): Promise<Board> {
  const response = await api.patch<Board>(`/boards/${boardId}`, data);
  return response.data;
}

export async function deleteBoard(boardId: string): Promise<void> {
  await api.delete(`/boards/${boardId}`);
}

// Columns
export async function getBoardColumns(boardId: string): Promise<BoardColumn[]> {
  const response = await api.get<BoardColumn[]>(`/boards/${boardId}/columns`);
  return response.data;
}

// getBoardColumnsWithTasks - removed, use getBoard() which returns full data

export async function createColumn(boardId: string, data: ColumnCreate): Promise<BoardColumn> {
  const response = await api.post<BoardColumn>(`/boards/${boardId}/columns`, data);
  return response.data;
}

export async function updateColumn(
  boardId: string,
  columnId: string,
  data: ColumnUpdate
): Promise<BoardColumn> {
  const response = await api.patch<BoardColumn>(`/boards/${boardId}/columns/${columnId}`, data);
  return response.data;
}

export async function deleteColumn(boardId: string, columnId: string): Promise<void> {
  await api.delete(`/boards/${boardId}/columns/${columnId}`);
}

export async function reorderColumns(boardId: string, columnIds: string[]): Promise<void> {
  await api.post(`/boards/${boardId}/columns/reorder`, { column_ids: columnIds });
}

// Tasks on board
export async function addTaskToBoard(
  boardId: string,
  taskId: string,
  columnId: string
): Promise<BoardTask> {
  const response = await api.post<BoardTask>(`/boards/${boardId}/tasks`, {
    task_id: taskId,
    column_id: columnId,
  });
  return response.data;
}

export async function moveTask(
  boardId: string,
  taskId: string,
  data: MoveTaskRequest
): Promise<BoardTask> {
  const response = await api.post<BoardTask>(`/boards/${boardId}/tasks/${taskId}/move`, data);
  return response.data;
}

export async function removeTaskFromBoard(boardId: string, taskId: string): Promise<void> {
  await api.delete(`/boards/${boardId}/tasks/${taskId}`);
}

// Members
export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  const response = await api.get<BoardMember[]>(`/boards/${boardId}/members`);
  return response.data;
}

export async function addBoardMember(
  boardId: string,
  userId: string,
  role: BoardMemberRole = "member"
): Promise<BoardMember> {
  const response = await api.post<BoardMember>(`/boards/${boardId}/members`, {
    user_id: userId,
    role,
  });
  return response.data;
}

export async function updateBoardMemberRole(
  boardId: string,
  userId: string,
  role: BoardMemberRole
): Promise<BoardMember> {
  const response = await api.patch<BoardMember>(`/boards/${boardId}/members/${userId}`, { role });
  return response.data;
}

export async function removeBoardMember(boardId: string, userId: string): Promise<void> {
  await api.delete(`/boards/${boardId}/members/${userId}`);
}
