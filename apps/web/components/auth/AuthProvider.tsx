"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getMe, type UserRead } from "@/lib/api/auth";
import { clearToken, getToken, saveToken } from "@/lib/auth/session";

interface AuthContextValue {
  user: UserRead | null;
  loading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserRead | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadFromToken(token: string) {
    try {
      const me = await getMe(token);
      setUser(me);
    } catch {
      clearToken();
      setUser(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    // Wrapped in a locally-scoped async function (rather than top-level
    // await/setState) so the initial "loading" render stays SSR-safe —
    // localStorage isn't available on the server, and this way the first
    // client render matches the server-rendered HTML before hydration
    // resolves the real session state.
    (async () => {
      const token = getToken();
      if (token) {
        try {
          const me = await getMe(token);
          if (!cancelled) setUser(me);
        } catch {
          clearToken();
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(token: string) {
    saveToken(token);
    await loadFromToken(token);
  }

  function signOut() {
    clearToken();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, loading, signIn, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
