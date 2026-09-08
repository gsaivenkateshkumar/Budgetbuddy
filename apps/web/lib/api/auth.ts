import { apiFetch } from "./client";

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface UserRead {
  id: number;
  email: string;
  display_name: string | null;
}

export function registerAccount(
  email: string,
  password: string,
  displayName?: string
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, display_name: displayName || undefined }),
  });
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe(token: string): Promise<UserRead> {
  return apiFetch<UserRead>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
