import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { login } from "../api";
import { useAuth } from "../context";
import type { LoginRequest, AuthResponse } from "../types";

export function useLogin() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: login,
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.clear();
      navigate("/");
    },
  });
}
