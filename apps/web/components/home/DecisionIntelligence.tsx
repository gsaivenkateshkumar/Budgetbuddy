import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { TiltCard } from "@/components/motion/TiltCard";

const STAGES = [
  {
    label: "Understand",
    body: "Budget Buddy identifies what matters for your situation — budget, use case, and must-have specs.",
  },
  {
    label: "Search",
    body: "It looks across the catalog for products that actually fit those criteria, not just a keyword match.",
  },
  {
    label: "Compare",
    body: "Matching options are weighed on price, specs, and reviews — including the trade-offs, not just the upside.",
  },
  {
    label: "Decide",
    body: "A recommendation comes with the reasoning behind it — evidence, not just a ranked list.",
  },
];

/** Explains the decision-logic pipeline generically — no fabricated
 * pros/trade-offs/verdicts here. Real per-product reasoning renders via
 * DecisionLogicCard once backend recommendation data exists. */
export function DecisionIntelligence() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Decision intelligence</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Budget Buddy doesn&apos;t just rank products by price. When a recommendation is shown, it comes
        with the reasoning behind it.
      </p>

      <div className="relative mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Connecting line — desktop only, purely decorative. */}
        <div
          className="pointer-events-none absolute top-8 right-8 left-8 hidden h-px bg-gradient-to-r from-violet-200 via-violet-300 to-violet-200 lg:block"
          aria-hidden="true"
        />
        {STAGES.map((stage, i) => {
          const isFinalStage = i === STAGES.length - 1;
          return (
            <Reveal key={stage.label} delayMs={i * 60}>
              <TiltCard className="h-full rounded-xl">
                <Card hover className="relative h-full p-5">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white ${
                      isFinalStage ? "bg-teal-800" : "bg-violet-600"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-slate-900">{stage.label}</h3>
                  <p className="mt-1.5 text-sm text-slate-600">{stage.body}</p>
                </Card>
              </TiltCard>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}
