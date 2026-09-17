"use client";

import Link from "next/link";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { canUseStartBot } from "./startbot-policy.mjs";
import { StartBotFallback } from "./StartBotFallback";

const StartBotCanvas = lazy(() => import("./StartBotCanvas"));

export function StartBot() {
  const [eligible, setEligible] = useState(false);
  const [failed, setFailed] = useState(false);
  const onFailure = useCallback(() => setFailed(true), []);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 769px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)");
    const device = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
    const update = () => setEligible(canUseStartBot({
      desktopMotion: media.matches,
      saveData: device.connection?.saveData,
      cores: device.hardwareConcurrency,
      memory: device.deviceMemory,
    }));
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const showCanvas = eligible && !failed;
  return (
    <div className="pointer-events-none fixed bottom-3 right-1 z-40 xl:bottom-6 xl:right-6">
      {/* Keep the compact control through laptop widths so it cannot cover
       * dense calculator and form controls. Wide desktops have enough side
       * room for the fuller premium presence. */}
      <Link
        href="/ask"
        aria-label="Ask Start Currency"
        className="pointer-events-auto block h-12 w-12 rounded-full border border-violet-200/30 bg-slate-950/90 p-1 shadow-[0_14px_36px_rgba(15,23,42,0.28)] transition-transform duration-150 hover:scale-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-violet-400 xl:h-[92px] xl:w-[92px] 2xl:h-[108px] 2xl:w-[108px]"
      >
        {showCanvas ? <Suspense fallback={<StartBotFallback />}><StartBotCanvas onFailure={onFailure} /></Suspense> : <StartBotFallback />}
        <span className="sr-only">Ask Start Currency</span>
      </Link>
    </div>
  );
}
