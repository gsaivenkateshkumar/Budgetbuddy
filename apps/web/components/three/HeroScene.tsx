"use client";

import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SceneFallback } from "./SceneFallback";
import { canUseBusinessScene, shouldAnimateScene } from "./scene-policy.mjs";

const BusinessCore = lazy(() => import("./BusinessCore"));

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure(); }
  render() { return this.state.failed ? <SceneFallback /> : this.props.children; }
}

export function HeroScene() {
  const panel = useRef<HTMLDivElement>(null);
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [inView, setInView] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const update = () => {
      setEligible(canUseBusinessScene({ desktopMotion: media.matches, saveData: device.connection?.saveData, cores: device.hardwareConcurrency, memory: device.deviceMemory }));
      setVisible(document.visibilityState === "visible");
    };
    update();
    media.addEventListener("change", update);
    document.addEventListener("visibilitychange", update);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (panel.current) observer.observe(panel.current);
    return () => {
      media.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", update);
      observer.disconnect();
    };
  }, []);

  const showCanvas = eligible && !failed;
  return (
    <figure className="mx-auto w-full max-w-lg self-center rounded-2xl border border-slate-800 bg-[#07080A] p-4 sm:p-6">
      <div className="flex min-h-11 items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-200">From idea to growth</p>
        {showCanvas && (
          <button type="button" onClick={() => setPaused((value) => !value)} aria-pressed={paused} className="min-h-11 rounded-lg px-3 text-xs text-slate-300 hover:bg-slate-800">
            {paused ? "Play visual" : "Pause visual"}
          </button>
        )}
      </div>
      {/* Only this reserved panel owns a canvas; it never wraps HTML controls. */}
      <div ref={panel} className="relative h-56 w-full sm:h-72 xl:h-80" aria-hidden="true">
        <div className="pointer-events-none absolute inset-0">
          {showCanvas ? (
            <SceneBoundary onFailure={onFailure}>
              <Suspense fallback={<SceneFallback />}>
                <BusinessCore active={shouldAnimateScene(visible, inView, paused)} onFailure={onFailure} />
              </Suspense>
            </SceneBoundary>
          ) : <SceneFallback />}
        </div>
      </div>
      <figcaption className="text-center">
        <p className="text-sm font-medium text-slate-200">Idea → Validate → Plan → Launch → Grow</p>
        <p className="mt-2 text-xs text-slate-400">A view of the process, not a forecast of business results.</p>
      </figcaption>
    </figure>
  );
}
