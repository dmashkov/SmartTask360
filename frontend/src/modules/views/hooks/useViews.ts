/**
 * SmartTask360 — User Views Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getViews,
  getDefaultView,
  createView,
  updateView,
  deleteView,
} from "../api";
import type { UserViewCreate, UserViewUpdate } from "../types";

// Query keys
export const viewKeys = {
  all: ["views"] as const,
  lists: () => [...viewKeys.all, "list"] as const,
  list: (viewType: string) => [...viewKeys.lists(), viewType] as const,
  default: (viewType: string) => [...viewKeys.all, "default", viewType] as const,
};

/**
 * Get all views for current user
 */
export function useViews(viewType = "task") {
  return useQuery({
    queryKey: viewKeys.list(viewType),
    queryFn: () => getViews(viewType),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get default view
 */
export function useDefaultView(viewType = "task") {
  return useQuery({
    queryKey: viewKeys.default(viewType),
    queryFn: () => getDefaultView(viewType),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Create a new view
 */
export function useCreateView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserViewCreate) => createView(data),
    onSuccess: (newView) => {
      // Invalidate views list
      queryClient.invalidateQueries({ queryKey: viewKeys.lists() });

      // If new view is default, invalidate default query
      if (newView.is_default) {
        queryClient.invalidateQueries({
          queryKey: viewKeys.default(newView.view_type),
        });
      }
    },
  });
}

/**
 * Update a view
 */
export function useUpdateView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ viewId, data }: { viewId: string; data: UserViewUpdate }) =>
      updateView(viewId, data),
    onSuccess: (updatedView) => {
      queryClient.invalidateQueries({ queryKey: viewKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: viewKeys.default(updatedView.view_type),
      });
    },
  });
}

/**
 * Delete a view
 */
export function useDeleteView() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: viewKeys.all });
    },
  });
}
