import Link from "next/link";

const POINTS = [
  "Product recommendations are computed independently of retailer or affiliate relationships.",
  "Where Budget Buddy may earn a commission, it never affects organic ranking.",
  "Retailer prices and availability can change — the retailer's checkout price always controls.",
  "Checkout happens on the retailer's own website, under their terms and policies.",
];

export function TrustSection() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
      <h2 className="text-xl font-semibold text-slate-900">Built on transparency</h2>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2 text-sm text-slate-600">
            <span className="mt-0.5 text-emerald-600" aria-hidden="true">
              ✓
            </span>
            {point}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-slate-500">
        Read more in our{" "}
        <Link href="/affiliate-disclosure" className="font-medium text-indigo-600 hover:text-indigo-700">
          Affiliate Disclosure
        </Link>{" "}
        and{" "}
        <Link href="/terms" className="font-medium text-indigo-600 hover:text-indigo-700">
          Terms of Use
        </Link>
        .
      </p>
    </div>
  );
}
