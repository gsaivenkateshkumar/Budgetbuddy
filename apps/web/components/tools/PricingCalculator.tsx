"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculatePricing, type PricingResult } from "@/lib/api/business";

export function PricingCalculator() {
  const [cost, setCost] = useState("100");
  const [margin, setMargin] = useState("20");
  const [fees, setFees] = useState("0");
  const [result, setResult] = useState<PricingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function calculate() {
    setError(null);
    setPending(true);
    try {
      const res = await calculatePricing({
        cost_per_unit: cost || "0",
        desired_margin_pct: margin || "0",
        fees_pct: fees || "0",
      });
      setResult(res);
    } catch {
      setError("Couldn't calculate — check that margin and fees are each under 100%.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Pricing calculator</h2>
      <p className="mt-1 text-sm text-slate-600">Work out a minimum viable selling price from cost and margin.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Cost per unit (₹)</span>
          <input
            type="number"
            min="0"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Desired margin (%)</span>
          <input
            type="number"
            min="0"
            max="99"
            value={margin}
            onChange={(e) => setMargin(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Fees/taxes on sale (%, optional)</span>
          <input
            type="number"
            min="0"
            max="99"
            value={fees}
            onChange={(e) => setFees(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
      </div>

      <Button type="button" onClick={calculate} disabled={pending} className="mt-4">
        {pending ? "Calculating…" : "Calculate"}
      </Button>

      {error && (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {result && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Suggested minimum price</p>
          <p className="text-2xl font-semibold tabular-nums text-slate-900">₹{result.suggested_price}</p>
          <p className="mt-3 text-sm text-slate-700">{result.explanation}</p>
        </div>
      )}
    </Card>
  );
}
