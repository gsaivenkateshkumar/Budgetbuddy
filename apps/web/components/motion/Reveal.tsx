"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Hard fail-safe: if the IntersectionObserver never fires (a backgrounded
// tab throttles/pauses observer callbacks, or the browser simply never
// reports intersection for some edge case), content must still become
// visible rather than sit at opacity: 0 forever. setTimeout at >=1s is not
// meaningfully throttled in background tabs the way rAF/observers can be,
// so this reliably fires even while hidden.
const FAIL_SAFE_MS = 1200;

/**
 * Restrained fade+translate reveal on scroll-into-view, for section-level
 * entrances (never per-paragraph — see globals.css `.reveal`). One
 * IntersectionObserver per instance; disconnects after the first reveal
 * since nothing here needs to re-hide on scroll-out. Renders already-
 * visible on the server and on first paint so there's no content flash
 * for no-JS/slow-hydration cases, then arms the reveal only once the
 * observer confirms the element is off-screen.
 */
export function Reveal({
  children,
  className = "",
  delayMs = 0,
}: {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Fail-safe: no observer support at all — stay visible rather than
    // gate content on an API that doesn't exist.
    if (typeof IntersectionObserver === "undefined") return;

    const rect = node.getBoundingClientRect();
    const alreadyInView = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyInView) return;

    setVisible(false);
    setArmed(true);

    let settled = false;
    function reveal() {
      if (settled) return;
      settled = true;
      setVisible(true);
      observer.disconnect();
      window.clearTimeout(failSafeTimer);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) reveal();
      },
      { threshold: 0.15 }
    );
    observer.observe(node);

    // Never leave content permanently dependent on the observer actually
    // firing — e.g. a throttled/backgrounded tab, or a viewport resize that
    // moves the element without a corresponding intersection event.
    const failSafeTimer = window.setTimeout(reveal, FAIL_SAFE_MS);

    return () => {
      settled = true;
      observer.disconnect();
      window.clearTimeout(failSafeTimer);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`}
      style={armed && delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
