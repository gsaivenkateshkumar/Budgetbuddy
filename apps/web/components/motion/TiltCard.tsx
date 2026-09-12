"use client";

import { useEffect, useRef, type ReactNode } from "react";

const MAX_TILT_DEG = 7;

/**
 * Restrained pointer-responsive depth for cards (LEVEL 2→3 in the surface
 * hierarchy): up to seven degrees of tilt plus a spotlight that follows the
 * pointer, both driven by CSS custom properties updated directly on the
 * DOM node inside a requestAnimationFrame — never React state — so a
 * mousemove never triggers a re-render. Inert on touch devices (no
 * `hover: hover` + `pointer: fine`) and under `prefers-reduced-motion`,
 * where `.tilt-surface`/`.tilt-spotlight` in globals.css disable the
 * transform/opacity outright regardless of what this sets.
 */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
  }, []);

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      node.style.setProperty("--tilt-x", `${(px - 0.5) * MAX_TILT_DEG * 2}deg`);
      node.style.setProperty("--tilt-y", `${(0.5 - py) * MAX_TILT_DEG * 2}deg`);
      node.style.setProperty("--spot-x", `${px * 100}%`);
      node.style.setProperty("--spot-y", `${py * 100}%`);
      node.style.setProperty("--spot-opacity", "1");
    });
  }

  function reset() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const node = ref.current;
    if (!node) return;
    node.style.setProperty("--tilt-x", "0deg");
    node.style.setProperty("--tilt-y", "0deg");
    node.style.setProperty("--spot-opacity", "0");
  }

  return (
    <div
      ref={ref}
      className={`tilt-surface relative ${className}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={reset}
      onPointerCancel={reset}
    >
      <div className="tilt-spotlight pointer-events-none absolute inset-0 rounded-[inherit]" aria-hidden="true" />
      {children}
    </div>
  );
}
