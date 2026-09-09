const STEPS = [
  {
    title: "Criteria",
    body: "Budget Buddy identifies what matters for your situation — budget, use case, and must-have specs.",
  },
  {
    title: "Trade-offs",
    body: "Every option has a catch. We surface what you'd be giving up, not just what you'd be getting.",
  },
  {
    title: "Reasoning",
    body: "A recommendation comes with the \"why\" behind it — evidence, not just a ranked list.",
  },
];

/** Explains the decision-logic concept generically — no fabricated
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
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div key={step.title} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-indigo-700">{step.title}</h3>
            <p className="text-sm text-slate-600">{step.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
