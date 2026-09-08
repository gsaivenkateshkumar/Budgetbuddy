/**
 * Client-side JWT storage. Uses localStorage rather than an httpOnly
 * cookie — simpler for a separately-hosted frontend/backend during MVP,
 * at the cost of XSS-readability that a cookie-based session wouldn't
 * have. A production hardening pass should move this to httpOnly
 * cookies + CSRF protection once frontend/backend share a deployment
 * topology that makes that practical. See docs/security.md.
 */
const TOKEN_KEY = "budget-buddy-token";

export function saveToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // localStorage unavailable (private browsing, disabled storage, ...) —
    // the session just won't persist across reloads.
  }
}

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}
