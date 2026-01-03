import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTask,
  updateTask,
  deleteTask,
  acceptTask,
  rejectTask,
  changeTaskStatus,
  addWatcher,
  removeWatcher,
  addParticipant,
  removeParticipant,
  addTaskTag,
  removeTaskTag,
} from "../api";
import { taskKeys } from "./useTasks";
import type { Task, TaskCreate, TaskUpdate, TaskAccept, TaskReject, TaskStatusChange } from "../types";

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, TaskCreate>({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { taskId: string; data: TaskUpdate }>({
    mutationFn: ({ taskId, data }) => updateTask(taskId, data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

export function useAcceptTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { taskId: string; data?: TaskAccept }>({
    mutationFn: ({ taskId, data }) => acceptTask(taskId, data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
  });
}

export function useRejectTask() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { taskId: string; data: TaskReject }>({
    mutationFn: ({ taskId, data }) => rejectTask(taskId, data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
  });
}

export function useChangeTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation<Task, Error, { taskId: string; data: TaskStatusChange }>({
    mutationFn: ({ taskId, data }) => changeTaskStatus(taskId, data),
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.setQueryData(taskKeys.detail(task.id), task);
    },
  });
}

export function useAddWatcher() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { taskId: string; userId: string }>({
    mutationFn: ({ taskId, userId }) => addWatcher(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "watchers"] });
    },
  });
}

export function useRemoveWatcher() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { taskId: string; userId: string }>({
    mutationFn: ({ taskId, userId }) => removeWatcher(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "watchers"] });
    },
  });
}

export function useAddParticipant() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { taskId: string; userId: string }>({
    mutationFn: ({ taskId, userId }) => addParticipant(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "participants"] });
    },
  });
}

export function useRemoveParticipant() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { taskId: string; userId: string }>({
    mutationFn: ({ taskId, userId }) => removeParticipant(taskId, userId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "participants"] });
    },
  });
}

export function useAddTaskTag() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { taskId: string; tagId: string }>({
    mutationFn: ({ taskId, tagId }) => addTaskTag(taskId, tagId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "tags"] });
    },
  });
}

export function useRemoveTaskTag() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { taskId: string; tagId: string }>({
    mutationFn: ({ taskId, tagId }) => removeTaskTag(taskId, tagId),
    onSuccess: (_, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: [...taskKeys.detail(taskId), "tags"] });
    },
  });
}
