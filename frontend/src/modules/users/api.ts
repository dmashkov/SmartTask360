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
