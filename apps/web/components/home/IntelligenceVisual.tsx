import { Card } from "@/components/ui/Card";
import { TiltCard } from "@/components/motion/TiltCard";

const STEPS = [
  { label: "Search", detail: "Find what fits" },
  { label: "Compare", detail: "Weigh trade-offs" },
  { label: "Decide", detail: "Best fit for you" },
];

/**
 * Conceptual "shopping intelligence" visualization for the homepage hero —
 * an AI core branching into search/compare/decide, expressed purely as
 * layered surfaces (no canvas/WebGL, no fabricated product/price/retailer
 * content). The whole composition tilts together as one object
 * (LEVEL 4 in the depth hierarchy) via a single outer TiltCard, rather
 * than each chip tracking the pointer independently.
 */
export function IntelligenceVisual() {
  return (
    <TiltCard className="mx-auto w-full max-w-sm rounded-2xl">
      <Card className="relative overflow-hidden p-6 shadow-sm">
        <div
          className="pointer-events-none absolute -top-12 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-violet-200/40 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex flex-col items-center gap-1 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600 text-sm font-bold text-white shadow-lg shadow-violet-600/30">
            AI
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">Budget Buddy</p>
          <p className="text-xs text-slate-500">Shopping intelligence</p>
        </div>

        <svg
          className="relative mx-auto mt-3 h-10 w-full max-w-[220px] text-violet-200"
          viewBox="0 0 220 40"
          fill="none"
          aria-hidden="true"
        >
          <path d="M110 0 V14" stroke="currentColor" strokeWidth="2" />
          <path d="M110 14 L20 34" stroke="currentColor" strokeWidth="2" />
          <path d="M110 14 L110 34" stroke="currentColor" strokeWidth="2" />
          <path d="M110 14 L200 34" stroke="currentColor" strokeWidth="2" />
        </svg>

        <div className="relative grid grid-cols-3 gap-2">
          {STEPS.map((step) => {
            const isDecide = step.label === "Decide";
            return (
              <Card
                key={step.label}
                hover
                className={`flex flex-col items-center gap-0.5 p-3 text-center ${
                  isDecide ? "ring-1 ring-inset ring-teal-200" : ""
                }`}
              >
                <span className={`text-xs font-semibold ${isDecide ? "text-teal-800" : "text-slate-900"}`}>
                  {step.label}
                </span>
                <span className="text-[11px] text-slate-500">{step.detail}</span>
              </Card>
            );
          })}
        </div>

        <p className="relative mt-4 text-center text-[11px] text-slate-500">
          Conceptual — not live product data
        </p>
      </Card>
    </TiltCard>
  );
}
