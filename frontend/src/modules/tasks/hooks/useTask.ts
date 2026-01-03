import { useQuery } from "@tanstack/react-query";
import { getTask, getAvailableTransitions, getWatchers, getParticipants, getTaskTags } from "../api";
import { taskKeys } from "./useTasks";

export function useTask(taskId: string, enabled = true) {
  return useQuery({
    queryKey: taskKeys.detail(taskId),
    queryFn: () => getTask(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useAvailableTransitions(taskId: string, enabled = true) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "transitions"],
    queryFn: () => getAvailableTransitions(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useTaskWatchers(taskId: string, enabled = true) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "watchers"],
    queryFn: () => getWatchers(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useTaskParticipants(taskId: string, enabled = true) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "participants"],
    queryFn: () => getParticipants(taskId),
    enabled: enabled && !!taskId,
  });
}

export function useTaskTags(taskId: string, enabled = true) {
  return useQuery({
    queryKey: [...taskKeys.detail(taskId), "tags"],
    queryFn: () => getTaskTags(taskId),
    enabled: enabled && !!taskId,
  });
}
