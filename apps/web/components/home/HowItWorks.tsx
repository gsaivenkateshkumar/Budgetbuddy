const STEPS = [
  {
    step: "1",
    title: "Tell us what you need",
    body: "Search for a product by name, or describe what you're trying to buy or accomplish in plain language.",
  },
  {
    step: "2",
    title: "Compare retailers and specs",
    body: "See price, specifications, and retailer options for matching products side by side, not just a single listing.",
  },
  {
    step: "3",
    title: "Get an explained recommendation",
    body: "Budget Buddy shows the reasoning behind each result — price, specs, and reviews — so you can decide with the full picture.",
  },
];

export function HowItWorks() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-900">How Budget Buddy works</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {STEPS.map((item) => (
          <div key={item.step} className="flex flex-col gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-semibold text-white">
              {item.step}
            </span>
            <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
            <p className="text-sm text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
