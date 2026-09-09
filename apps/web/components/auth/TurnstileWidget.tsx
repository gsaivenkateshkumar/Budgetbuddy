"use client";

import Script from "next/script";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export interface TurnstileWidgetHandle {
  /** Forces a fresh challenge and clears the current token — call this
   * after any failed submit (wrong credentials, rejected CAPTCHA, etc.),
   * since a Turnstile token is single-use and must never be resubmitted. */
  reset: () => void;
}

interface TurnstileWidgetProps {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire: () => void;
  onError: () => void;
}

/** Thin wrapper around the official Cloudflare Turnstile widget (explicit
 * render mode, so we control the token lifecycle instead of relying on a
 * hidden form input). The widget manages its own accessible challenge UI
 * inside an iframe; this component only bridges its callbacks to React
 * state in the parent form. */
export const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ siteKey, onToken, onExpire, onError }, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const [scriptReady, setScriptReady] = useState(false);

    useImperativeHandle(ref, () => ({
      reset() {
        if (window.turnstile && widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      if (!scriptReady || !containerRef.current || !window.turnstile) return;

      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": onExpire,
        "error-callback": onError,
      });
      widgetIdRef.current = widgetId;

      return () => {
        window.turnstile?.remove(widgetId);
        widgetIdRef.current = null;
      };
      // Re-render only if the script readiness or site key changes — the
      // callbacks are stable enough within a single form's lifetime that
      // re-subscribing on every render would just thrash the widget.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scriptReady, siteKey]);

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onReady={() => setScriptReady(true)}
        />
        <div ref={containerRef} />
      </>
    );
  }
);
