import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCurrentUser, updateCurrentUser, changePassword } from "../api";
import { useAuth } from "../context";
import type { User, ChangePasswordRequest } from "../types";

export function useCurrentUser() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["currentUser"],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
    initialData: user || undefined,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateCurrentUser() {
  const queryClient = useQueryClient();
  const { updateUser } = useAuth();

  return useMutation<User, Error, Partial<User>>({
    mutationFn: updateCurrentUser,
    onSuccess: (data) => {
      updateUser(data);
      queryClient.setQueryData(["currentUser"], data);
    },
  });
}

export function useChangePassword() {
  return useMutation<void, Error, ChangePasswordRequest>({
    mutationFn: changePassword,
  });
}
