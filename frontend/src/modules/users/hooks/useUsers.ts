import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../api";
import type { User, UsersMap } from "../types";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Hook that returns a map for quick lookups by ID
export function useUsersMap() {
  const { data: users, ...rest } = useUsers();

  const usersMap: UsersMap = new Map();
  if (users) {
    users.forEach((user) => {
      usersMap.set(user.id, user);
    });
  }

  return { usersMap, users, ...rest };
}

// Helper to get initials from name
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

// Helper to get user by ID from map
export function getUserById(usersMap: UsersMap, id: string | null): User | undefined {
  if (!id) return undefined;
  return usersMap.get(id);
}
