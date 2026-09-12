const POINTS = [
  "Financial calculations (break-even, margin, pricing) are computed by deterministic code, never estimated by an AI.",
  "Your business, budget, task, and financial data is private to your account — never shown to other users.",
  "Revenue, expense, and financial summary figures always come from entries you've actually recorded.",
  "Start Currency never promises guaranteed profit, success, ROI, or demand for any business idea.",
];

export function TrustSection() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">Built on transparency</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-slate-600">
            <span className="mt-0.5 text-teal-600" aria-hidden="true">
              ✓
            </span>
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-slate-500">
        Start Currency is business planning software. It does not provide financial, legal, investment,
        or tax advice — confirm important decisions with a qualified professional.
      </p>
    </div>
  );
}
