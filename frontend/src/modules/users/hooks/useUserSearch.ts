import { useQuery } from "@tanstack/react-query";
import { searchUsers } from "../api";

export function useUserSearch(query: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ["users", "search", query],
    queryFn: () => searchUsers(query),
    enabled: enabled && query.length >= 1,
    staleTime: 1000 * 30, // 30 seconds
  });
}
