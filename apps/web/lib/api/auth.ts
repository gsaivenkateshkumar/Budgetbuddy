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
  turnstileToken: string,
  displayName?: string
): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      display_name: displayName || undefined,
      turnstile_token: turnstileToken,
    }),
  });
}

export function login(email: string, password: string, turnstileToken: string): Promise<TokenResponse> {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password, turnstile_token: turnstileToken }),
  });
}

export function getMe(token: string): Promise<UserRead> {
  return apiFetch<UserRead>("/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}
