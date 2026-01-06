import { api } from "../../shared/api";
import type { User } from "./types";

export async function getUsers(): Promise<User[]> {
  const response = await api.get<User[]>("/users/");
  return response.data;
}

export async function getUser(id: string): Promise<User> {
  const response = await api.get<User>(`/users/${id}`);
  return response.data;
}

export async function searchUsers(query: string, limit: number = 10): Promise<User[]> {
  if (!query || query.length < 1) return [];
  const response = await api.get<User[]>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  return response.data;
}
