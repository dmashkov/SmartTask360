import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context";

export function useLogout() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const queryClient = useQueryClient();

  return useCallback(() => {
    logout();
    queryClient.clear();
    navigate("/login");
  }, [logout, queryClient, navigate]);
}
