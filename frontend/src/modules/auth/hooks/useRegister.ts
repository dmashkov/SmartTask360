import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { register } from "../api";
import { useAuth } from "../context";
import type { RegisterRequest, AuthResponse } from "../types";

export function useRegister() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<AuthResponse, Error, RegisterRequest>({
    mutationFn: register,
    onSuccess: (data) => {
      updateUser(data.user);
      queryClient.clear();
      navigate("/");
    },
  });
}
