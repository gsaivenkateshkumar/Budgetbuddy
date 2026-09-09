"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";
import { ApiError } from "@/lib/api/client";
import { login } from "@/lib/api/auth";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!captchaToken) {
      setCaptchaError("Please complete the security check.");
      return;
    }

    setPending(true);
    try {
      const { access_token } = await login(email, password, captchaToken);
      await signIn(access_token);
      router.push("/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      // A Turnstile token is single-use — whatever the failure reason
      // (wrong credentials, rejected CAPTCHA, or anything else), the
      // consumed/stale token must never be resubmitted.
      setCaptchaToken("");
      turnstileRef.current?.reset();
    } finally {
      setPending(false);
    }
  }

  return (
    <Container className="message-in flex max-w-md flex-col gap-6 py-16">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-1 text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-violet-600 hover:text-violet-700">
            Register
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-slate-600">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="password" className="text-xs font-medium text-slate-600">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {TURNSTILE_SITE_KEY ? (
            <TurnstileWidget
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onToken={(token) => {
                setCaptchaToken(token);
                setCaptchaError(null);
              }}
              onExpire={() => {
                setCaptchaToken("");
                setCaptchaError("Please complete the security check.");
              }}
              onError={() => {
                setCaptchaToken("");
                setCaptchaError("Security verification failed. Please try again.");
              }}
            />
          ) : (
            <p className="text-xs text-slate-500">Security verification isn&apos;t configured on this server yet.</p>
          )}
          {captchaError && (
            <p className="text-xs text-red-600" role="alert">
              {captchaError}
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:bg-slate-300"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>
    </Container>
  );
}
