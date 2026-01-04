export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department_id?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type UserRole = "admin" | "manager" | "executor";

// Map of user ID to user data for quick lookups
export type UsersMap = Map<string, User>;
