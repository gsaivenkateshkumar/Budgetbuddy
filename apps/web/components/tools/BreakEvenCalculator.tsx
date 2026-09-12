"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { calculateBreakEven, type BreakEvenResult } from "@/lib/api/business";

export function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState("10000");
  const [sellingPrice, setSellingPrice] = useState("100");
  const [variableCost, setVariableCost] = useState("50");
  const [result, setResult] = useState<BreakEvenResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function calculate() {
    setError(null);
    setPending(true);
    try {
      const res = await calculateBreakEven({
        fixed_costs: fixedCosts || "0",
        selling_price: sellingPrice || "0",
        variable_cost_per_unit: variableCost || "0",
      });
      setResult(res);
    } catch {
      setError("Couldn't calculate — check your inputs.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Break-even calculator</h2>
      <p className="mt-1 text-sm text-slate-600">
        How many units (or how much revenue) do you need to cover your costs?
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Fixed monthly costs (₹)</span>
          <input
            type="number"
            min="0"
            value={fixedCosts}
            onChange={(e) => setFixedCosts(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Selling price per unit (₹)</span>
          <input
            type="number"
            min="0"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Variable cost per unit (₹)</span>
          <input
            type="number"
            min="0"
            value={variableCost}
            onChange={(e) => setVariableCost(e.target.value)}
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
          {result.is_viable ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Break-even units</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">{result.break_even_units}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Break-even revenue</p>
                <p className="text-xl font-semibold tabular-nums text-slate-900">₹{result.break_even_revenue}</p>
              </div>
            </div>
          ) : null}
          <p className="mt-3 text-sm text-slate-700">{result.explanation}</p>
        </div>
      )}
    </Card>
  );
}
