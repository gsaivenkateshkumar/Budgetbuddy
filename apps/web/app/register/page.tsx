"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { Container } from "@/components/layout/Container";
import { useAuth } from "@/components/auth/AuthProvider";
import { TurnstileWidget, type TurnstileWidgetHandle } from "@/components/auth/TurnstileWidget";
import { ApiError } from "@/lib/api/client";
import { registerAccount } from "@/lib/api/auth";
import { TURNSTILE_SITE_KEY } from "@/lib/siteConfig";

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);

  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setConfirmTouched(true);
      return;
    }

    if (!captchaToken) {
      setCaptchaError("Please complete the security check.");
      return;
    }

    setPending(true);
    try {
      const { access_token } = await registerAccount(email, password, captchaToken, displayName || undefined);
      await signIn(access_token);
      router.push("/account");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      // A Turnstile token is single-use — whatever the failure reason
      // (email already taken, rejected CAPTCHA, or anything else), the
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
        <h1 className="text-2xl font-semibold text-slate-900">Create an account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Already have one?{" "}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
            Log in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="displayName" className="text-xs font-medium text-slate-600">
            Name (optional)
          </label>
          <input
            id="displayName"
            type="text"
            autoComplete="name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
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
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <p className="text-xs text-slate-500">At least 8 characters.</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="confirmPassword" className="text-xs font-medium text-slate-600">
            Confirm password
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={() => setConfirmTouched(true)}
            aria-invalid={confirmTouched && passwordsMismatch}
            aria-describedby={confirmTouched && passwordsMismatch ? "confirmPassword-error" : undefined}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          {confirmTouched && passwordsMismatch && (
            <p id="confirmPassword-error" className="text-xs text-red-600" role="alert">
              Passwords do not match.
            </p>
          )}
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
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </Container>
  );
}
