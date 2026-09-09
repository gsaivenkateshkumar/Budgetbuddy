import Link from "next/link";
import type { ScoredCandidate } from "@/lib/api/types";
import { Badge } from "@/components/ui/Badge";
import { Price } from "@/components/ui/Price";

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
  const lowestPrice = Math.min(...candidates.map((c) => Number(c.evidence.price)));

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="sticky left-0 z-10 w-40 bg-white p-4 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
              <span className="sr-only">Attribute</span>
            </th>
            {candidates.map((c) => (
              <th key={c.evidence.product_slug} className="p-4 text-left align-top">
                <div className="mb-1 flex flex-wrap gap-1">
                  {c.labels.map((label) => (
                    <Badge key={label} tone="info">
                      {label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {c.evidence.brand_name}
                </p>
                <Link
                  href={`/products/${c.evidence.product_slug}`}
                  className="text-base font-semibold text-slate-900 hover:text-violet-700"
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
            {candidates.map((c) => {
              const isLowest = Number(c.evidence.price) === lowestPrice && candidates.length > 1;
              return (
                <td key={c.evidence.product_slug} className="p-4">
                  <Price
                    value={c.evidence.price}
                    currency={c.evidence.currency}
                    size="lg"
                    className={isLowest ? "text-teal-800" : undefined}
                  />
                  {isLowest && (
                    <span className="ml-2 align-middle">
                      <Badge tone="success">Lowest</Badge>
                    </span>
                  )}
                </td>
              );
            })}
          </tr>
          <tr className="border-b border-slate-100">
            <th scope="row" className="p-4 text-left text-xs font-medium text-slate-500">
              Best retailer
            </th>
            {candidates.map((c) => (
              <td key={c.evidence.product_slug} className="p-4 text-slate-700">
                {c.evidence.best_retailer_slug}{" "}
                <span className="text-slate-500">
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
                className="bg-violet-50/50 p-3 text-left text-xs font-semibold uppercase tracking-wide text-violet-700"
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
              <th scope="row" className="p-4 text-left text-xs font-medium capitalize text-slate-500">
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
