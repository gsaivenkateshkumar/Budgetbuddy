import { Card } from "@/components/ui/Card";

const REASONS = [
  {
    title: "Compare across retailers",
    body: "Price, specs, and availability pulled from multiple retailers — not just a single listing.",
  },
  {
    title: "AI-assisted recommendations",
    body: "Ask Budget Buddy explains the reasoning behind a suggestion — price, specs, reviews — never a bare ranking.",
  },
  {
    title: "No retailer bias",
    body: "Organic rankings never change based on which retailer or affiliate link pays more.",
  },
  {
    title: "Real catalog data only",
    body: "Every price and product shown is data we've actually retrieved — never invented or estimated.",
  },
];

export function WhyBudgetBuddy() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Why Budget Buddy</h2>
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
