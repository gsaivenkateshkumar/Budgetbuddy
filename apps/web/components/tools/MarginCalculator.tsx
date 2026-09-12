"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateMargin, type MarginResult } from "@/lib/api/business";

export function MarginCalculator() {
  const [revenue, setRevenue] = useState("50000");
  const [cogs, setCogs] = useState("20000");
  const [opex, setOpex] = useState("10000");
  const [result, setResult] = useState<MarginResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function calculate() {
    setError(null);
    setPending(true);
    try {
      const res = await calculateMargin({ revenue: revenue || "0", cogs: cogs || "0", operating_expenses: opex || "0" });
      setResult(res);
    } catch {
      setError("Couldn't calculate — check your inputs.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Profit margin calculator</h2>
      <p className="mt-1 text-sm text-slate-600">See gross and operating margin from your real numbers.</p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Revenue (₹)</span>
          <input
            type="number"
            min="0"
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">COGS / direct cost (₹)</span>
          <input
            type="number"
            min="0"
            value={cogs}
            onChange={(e) => setCogs(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Operating expenses (₹)</span>
          <input
            type="number"
            min="0"
            value={opex}
            onChange={(e) => setOpex(e.target.value)}
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Gross profit</p>
              <p className="text-xl font-semibold tabular-nums text-slate-900">
                ₹{result.gross_profit} {result.gross_margin_pct && `(${result.gross_margin_pct}%)`}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Operating profit</p>
              <p className="text-xl font-semibold tabular-nums text-slate-900">
                ₹{result.operating_profit} {result.operating_margin_pct && `(${result.operating_margin_pct}%)`}
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-700">{result.explanation}</p>
        </div>
      )}
    </Card>
  );
}
