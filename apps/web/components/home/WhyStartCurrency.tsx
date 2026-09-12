import { Card } from "@/components/ui/Card";

const REASONS = [
  {
    title: "Deterministic calculations",
    body: "Break-even, margin, and pricing are computed by code, not guessed by an AI — the same numbers every time.",
  },
  {
    title: "A real business workspace",
    body: "Your idea, budget, roadmap, and financials persist in one place — not scattered across chat history.",
  },
  {
    title: "Honest validation, not hype",
    body: "Scores are based on fixed, visible rules. Where information is missing, confidence is marked low — never inflated.",
  },
  {
    title: "No fabricated numbers",
    body: "Every revenue, expense, and financial total shown comes from an entry you actually recorded.",
  },
];

export function WhyStartCurrency() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Why Start Currency</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REASONS.map((item) => (
          <Card key={item.title} className="p-5">
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.body}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
