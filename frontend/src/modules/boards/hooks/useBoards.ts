import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBoards,
  getBoard,
  getBoardColumns,
  createBoard,
  updateBoard,
  deleteBoard,
  moveTask,
} from "../api";
import type { Board, BoardFull, BoardCreate, BoardUpdate, MoveTaskRequest, BoardColumnWithTasks } from "../types";

export const boardKeys = {
  all: ["boards"] as const,
  lists: () => [...boardKeys.all, "list"] as const,
  list: () => [...boardKeys.lists()] as const,
  details: () => [...boardKeys.all, "detail"] as const,
  detail: (id: string) => [...boardKeys.details(), id] as const,
  columns: (id: string) => [...boardKeys.detail(id), "columns"] as const,
  columnsWithTasks: (id: string) => [...boardKeys.detail(id), "columns-tasks"] as const,
};

export function useBoards() {
  return useQuery({
    queryKey: boardKeys.list(),
    queryFn: getBoards,
  });
}

export function useBoard(boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardKeys.detail(boardId),
    queryFn: () => getBoard(boardId),
    enabled: enabled && !!boardId,
  });
}

export function useBoardColumns(boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardKeys.columns(boardId),
    queryFn: () => getBoardColumns(boardId),
    enabled: enabled && !!boardId,
  });
}

// Transform BoardFull data to columns with tasks
export function useBoardColumnsWithTasks(boardId: string, enabled = true) {
  return useQuery({
    queryKey: boardKeys.columnsWithTasks(boardId),
    queryFn: async (): Promise<BoardColumnWithTasks[]> => {
      const board = await getBoard(boardId);

      // Group tasks by column
      const tasksByColumn = new Map<string, BoardFull["tasks"]>();
      for (const task of board.tasks) {
        const existing = tasksByColumn.get(task.column_id) || [];
        existing.push(task);
        tasksByColumn.set(task.column_id, existing);
      }

      // Build columns with tasks
      return board.columns.map((column) => ({
        ...column,
        tasks: (tasksByColumn.get(column.id) || []).sort((a, b) => a.order_index - b.order_index),
      }));
    },
    enabled: enabled && !!boardId,
  });
}

export function useCreateBoard() {
  const queryClient = useQueryClient();

  return useMutation<Board, Error, BoardCreate>({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

export function useUpdateBoard() {
  const queryClient = useQueryClient();

  return useMutation<Board, Error, { boardId: string; data: BoardUpdate }>({
    mutationFn: ({ boardId, data }) => updateBoard(boardId, data),
    onSuccess: (board) => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
      queryClient.setQueryData(boardKeys.detail(board.id), board);
    },
  });
}

export function useDeleteBoard() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.lists() });
    },
  });
}

export function useMoveTask(boardId: string) {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, { taskId: string; data: MoveTaskRequest }>({
    mutationFn: ({ taskId, data }) => moveTask(boardId, taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: boardKeys.columnsWithTasks(boardId) });
      queryClient.invalidateQueries({ queryKey: boardKeys.detail(boardId) });
    },
  });
}
