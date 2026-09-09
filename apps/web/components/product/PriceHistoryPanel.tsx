"use client";

import { useEffect, useState } from "react";
import { getVariantPriceHistory } from "@/lib/api/products";
import type { PriceHistoryResponse } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

function PriceSparkline({ points }: { points: PriceHistoryResponse["points"] }) {
  if (points.length < 2) return null;

  const prices = points.map((p) => Number(p.price));
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const width = 320;
  const height = 72;
  const stepX = width / (points.length - 1);

  const coords = prices.map((price, i) => {
    const x = i * stepX;
    const y = height - ((price - min) / range) * (height - 16) - 8;
    return { x, y };
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full text-indigo-600" role="img" aria-label="Price history over time">
      <polyline
        points={coords.map((c) => `${c.x},${c.y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} className="fill-indigo-600" />
      ))}
    </svg>
  );
}

/** Renders fresh each time productSlug/variantSku changes because the
 * parent keys this component by variant SKU — that remount gives each
 * fetch a clean "loading" state for free, with no setState-in-effect
 * needed to reset it. */
export function PriceHistoryPanel({ productSlug, variantSku }: { productSlug: string; variantSku: string }) {
  const [data, setData] = useState<PriceHistoryResponse | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  // Computed once when data arrives (in the effect callback, not render)
  // to avoid calling the impure Date.now() during render.
  const [trackingDays, setTrackingDays] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    getVariantPriceHistory(productSlug, variantSku)
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus(result.points.length > 0 ? "ready" : "empty");
        setTrackingDays(
          Math.max(
            1,
            Math.round(
              (Date.now() - new Date(result.stats.tracking_since).getTime()) / (1000 * 60 * 60 * 24)
            )
          )
        );
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [productSlug, variantSku]);

  if (status === "loading") {
    return <div className="h-40 animate-pulse rounded-xl bg-slate-100" />;
  }
  if (status === "error" || status === "empty" || !data || trackingDays === null) {
    return null;
  }

  const { stats } = data;
  const trackedSince = new Date(stats.tracking_since).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Price history — {data.retailer_name}</h2>
        {stats.is_lowest_recorded && (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            Lowest we&apos;ve recorded
          </span>
        )}
      </div>

      <PriceSparkline points={data.points} />

      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-slate-500 sm:grid-cols-4">
        <div>
          <dt>Lowest recorded</dt>
          <dd className="tabular-nums font-medium text-slate-900">
            {formatPrice(stats.lowest_recorded_price, data.currency)}
          </dd>
        </div>
        <div>
          <dt>Highest recorded</dt>
          <dd className="tabular-nums font-medium text-slate-900">
            {formatPrice(stats.highest_recorded_price, data.currency)}
          </dd>
        </div>
        <div>
          <dt>Average</dt>
          <dd className="tabular-nums font-medium text-slate-900">
            {formatPrice(stats.average_price, data.currency)}
          </dd>
        </div>
        <div>
          <dt>Tracked for</dt>
          <dd className="font-medium text-slate-900">
            {trackingDays} day{trackingDays === 1 ? "" : "s"}
          </dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] text-slate-600">
        Based on {stats.price_point_count} recorded price check{stats.price_point_count === 1 ? "" : "s"}{" "}
        since {trackedSince}. Not a claim of the lowest price ever — only what we&apos;ve tracked.
      </p>
    </div>
  );
}
