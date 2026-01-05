/**
 * SmartTask360 — Task History hooks
 */

import { useQuery } from "@tanstack/react-query";
import { getTaskHistory } from "../api";

export function useTaskHistory(taskId: string) {
  return useQuery({
    queryKey: ["task-history", taskId],
    queryFn: () => getTaskHistory(taskId),
    enabled: !!taskId,
  });
}
