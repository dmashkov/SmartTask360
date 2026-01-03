import { api, saveTokens, clearTokens, getRefreshToken } from "../../shared/api";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  AuthTokens,
  ChangePasswordRequest,
} from "./types";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  // Backend expects JSON with email/password
  const response = await api.post<AuthTokens>("/auth/login", {
    email: data.email,
    password: data.password,
  });

  const tokens = response.data;
  saveTokens(tokens.access_token, tokens.refresh_token);

  // Fetch user after login
  const user = await getCurrentUser();

  return { user, tokens };
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await api.post<ApiResponse<AuthResponse>>("/auth/register", data);

  const authData = response.data.data;
  saveTokens(authData.tokens.access_token, authData.tokens.refresh_token);

  return authData;
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  if (refreshToken) {
    try {
      await api.post("/auth/logout", { refresh_token: refreshToken });
    } catch {
      // Ignore errors on logout
    }
  }

  clearTokens();
}

export async function refreshAccessToken(): Promise<AuthTokens> {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await api.post<AuthTokens>("/auth/refresh", {
    refresh_token: refreshToken,
  });

  const tokens = response.data;
  saveTokens(tokens.access_token, tokens.refresh_token);

  return tokens;
}

export async function getCurrentUser(): Promise<User> {
  const response = await api.get<User>("/users/me");
  return response.data;
}

export async function updateCurrentUser(data: Partial<User>): Promise<User> {
  const response = await api.patch<User>("/users/me", data);
  return response.data;
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await api.post("/auth/change-password", data);
}
