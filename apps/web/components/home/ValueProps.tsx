const VALUE_PROPS = [
  {
    title: "Compare what matters",
    body: "Price, specs, reviews, and retailer trust — not just who's cheapest today.",
  },
  {
    title: "Explainable recommendations",
    body: "Every ranking is computed from real data, with the reasoning shown — never a black box.",
  },
  {
    title: "Transparent freshness",
    body: "Every price shows when it was last checked, so you always know how current it is.",
  },
];

export function ValueProps() {
  return (
    <div className="grid gap-6 sm:grid-cols-3">
      {VALUE_PROPS.map((item) => (
        <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
          <p className="mt-2 text-sm text-slate-600">{item.body}</p>
        </div>
      ))}
    </div>
  );
}
