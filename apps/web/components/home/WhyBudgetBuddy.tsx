const REASONS = [
  {
    title: "Retailer-independent by design",
    body: "Organic recommendations are computed from price, specs, and reviews — never influenced by which retailer or affiliate link pays more. See our Affiliate Disclosure for how monetization works.",
  },
  {
    title: "AI-powered, not AI-guessed",
    body: "Ask Budget Buddy answers from real catalog data it retrieves for your question — it doesn't invent products, prices, or specs it hasn't looked up.",
  },
  {
    title: "Honest about coverage",
    body: "Retailer integrations and product coverage are actively expanding. We'd rather show you what's genuinely available than fake a fuller catalog.",
  },
];

export function WhyBudgetBuddy() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">Why Budget Buddy</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {REASONS.map((item) => (
          <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs text-slate-400">
        Read more in our{" "}
        <a href="/about" className="font-medium text-indigo-600 hover:text-indigo-700">
          About
        </a>{" "}
        and{" "}
        <a href="/affiliate-disclosure" className="font-medium text-indigo-600 hover:text-indigo-700">
          Affiliate Disclosure
        </a>{" "}
        pages.
      </p>
    </div>
  );
}
