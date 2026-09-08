import Link from "next/link";
import type { ScoredCandidate } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

function collectSpecKeys(candidates: ScoredCandidate[]): { differing: string[]; common: string[] } {
  const allKeys = new Set<string>();
  candidates.forEach((c) => Object.keys(c.evidence.specs).forEach((k) => allKeys.add(k)));

  const differing: string[] = [];
  const common: string[] = [];
  allKeys.forEach((key) => {
    const values = candidates.map((c) => JSON.stringify(c.evidence.specs[key] ?? null));
    const allSame = values.every((v) => v === values[0]);
    (allSame ? common : differing).push(key);
  });
  return { differing: differing.sort(), common: common.sort() };
}

function formatSpecValue(value: unknown): string {
  if (value === undefined || value === null) return "—";
  return String(value);
}

export function ComparisonTable({ candidates }: { candidates: ScoredCandidate[] }) {
  const { differing, common } = collectSpecKeys(candidates);

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="w-40 p-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="sr-only">Attribute</span>
            </th>
            {candidates.map((c) => (
              <th key={c.evidence.product_slug} className="p-4 text-left align-top">
                <div className="mb-1 flex flex-wrap gap-1">
                  {c.labels.map((label) => (
                    <span
                      key={label}
                      className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {c.evidence.brand_name}
                </p>
                <Link
                  href={`/products/${c.evidence.product_slug}`}
                  className="text-base font-semibold text-slate-900 hover:text-indigo-700"
                >
                  {c.evidence.product_name}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th scope="row" className="p-4 text-left text-xs font-medium text-slate-500">
              Price
            </th>
            {candidates.map((c) => (
              <td key={c.evidence.product_slug} className="p-4 font-semibold text-slate-900">
                {formatPrice(c.evidence.price, c.evidence.currency)}
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100">
            <th scope="row" className="p-4 text-left text-xs font-medium text-slate-500">
              Best retailer
            </th>
            {candidates.map((c) => (
              <td key={c.evidence.product_slug} className="p-4 text-slate-700">
                {c.evidence.best_retailer_slug}{" "}
                <span className="text-slate-400">
                  ({c.evidence.offer_count} offer{c.evidence.offer_count === 1 ? "" : "s"})
                </span>
              </td>
            ))}
          </tr>
          <tr className="border-b border-slate-100 bg-slate-50/60">
            <th scope="row" className="p-4 text-left text-xs font-medium text-slate-500">
              Rating
            </th>
            {candidates.map((c) => (
              <td key={c.evidence.product_slug} className="p-4 text-slate-700">
                {c.evidence.rating !== null
                  ? `${c.evidence.rating.toFixed(1)}★ (${c.evidence.review_count ?? 0})`
                  : "No review data"}
              </td>
            ))}
          </tr>

          {differing.length > 0 && (
            <tr>
              <th
                colSpan={candidates.length + 1}
                className="bg-indigo-50/50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-indigo-700"
              >
                Key differences
              </th>
            </tr>
          )}
          {differing.map((key, i) => (
            <tr key={key} className={i % 2 === 0 ? "border-b border-slate-100" : "border-b border-slate-100 bg-slate-50/60"}>
              <th scope="row" className="p-4 text-left text-xs font-medium capitalize text-slate-500">
                {key.replace(/_/g, " ")}
              </th>
              {candidates.map((c) => (
                <td key={c.evidence.product_slug} className="p-4 text-slate-900">
                  {formatSpecValue(c.evidence.specs[key])}
                </td>
              ))}
            </tr>
          ))}

          {common.length > 0 && (
            <tr>
              <th
                colSpan={candidates.length + 1}
                className="bg-slate-50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                Also shared
              </th>
            </tr>
          )}
          {common.map((key, i) => (
            <tr key={key} className={i % 2 === 0 ? "border-b border-slate-100" : "border-b border-slate-100 bg-slate-50/60"}>
              <th scope="row" className="p-4 text-left text-xs font-medium capitalize text-slate-400">
                {key.replace(/_/g, " ")}
              </th>
              {candidates.map((c) => (
                <td key={c.evidence.product_slug} className="p-4 text-slate-500">
                  {formatSpecValue(c.evidence.specs[key])}
                </td>
              ))}
            </tr>
          ))}

          <tr>
            <th scope="row" className="p-4 text-left text-xs font-medium text-slate-500">
              Why this rank
            </th>
            {candidates.map((c) => (
              <td key={c.evidence.product_slug} className="p-4 align-top">
                <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                  {c.explanation.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
