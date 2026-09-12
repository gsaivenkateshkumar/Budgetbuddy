import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";

const DIMENSIONS = [
  { label: "Demand evidence", max: 20 },
  { label: "Differentiation clarity", max: 15 },
  { label: "Business-model clarity", max: 15 },
  { label: "Capital feasibility", max: 20 },
  { label: "Operational feasibility", max: 15 },
  { label: "Go-to-market readiness", max: 15 },
];

/** Explains the deterministic scoring methodology behind /validate — no
 * fabricated example scores here, just the fixed rubric every validation
 * is computed from. See apps/api/app/services/validation_engine.py. */
export function ValidationMethodology() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">How validation scoring works</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Start Currency doesn&apos;t let an AI invent a score. Every validation report is computed from
        six fixed, deterministic dimensions that add up to 100 — the AI only writes the narrative
        explanation, grounded in that score.
      </p>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {DIMENSIONS.map((dim, i) => (
          <Reveal key={dim.label} delayMs={i * 60}>
            <TiltCard className="h-full rounded-xl">
              <Card hover className="relative flex h-full items-center justify-between gap-3 p-5">
                <span className="text-sm font-semibold text-slate-900">{dim.label}</span>
                <span className="tabular-nums text-sm font-semibold text-violet-600">/{dim.max}</span>
              </Card>
            </TiltCard>
          </Reveal>
        ))}
      </div>

      <p className="mt-5 text-xs text-slate-500">
        Where information is missing, confidence is marked Low or Medium rather than the score being
        inflated — see your report for exactly what&apos;s missing.
      </p>
    </div>
  );
}
