"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

interface Row {
  id: string;
  category: string;
  amount: string;
}

const DEFAULT_ROWS: Row[] = [
  { id: "equipment", category: "Equipment", amount: "" },
  { id: "inventory", category: "Inventory", amount: "" },
  { id: "marketing", category: "Marketing", amount: "" },
  { id: "licensing", category: "Licensing / admin", amount: "" },
  { id: "working-capital", category: "Working capital", amount: "" },
  { id: "reserve", category: "Emergency reserve", amount: "" },
];

function total(rows: Row[]): number {
  return rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
}

/** Client-side only — a quick planning calculator. A per-business budget
 * that persists across sessions lives in the business workspace
 * (GET/PUT /businesses/{id}/budget), which reuses this same category
 * pattern once you're validating a specific idea. */
export function StartupBudgetCalculator() {
  const [rows, setRows] = useState<Row[]>(DEFAULT_ROWS);
  const idPrefix = useId();

  function updateAmount(id: string, amount: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, amount } : r)));
  }

  function updateCategory(id: string, category: string) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, category } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { id: `${idPrefix}-${prev.length}`, category: "", amount: "" }]);
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Startup budget calculator</h2>
      <p className="mt-1 text-sm text-slate-600">
        Break your available capital into real categories. Add, rename, or remove rows freely.
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            <input
              value={row.category}
              onChange={(e) => updateCategory(row.id, e.target.value)}
              placeholder="Category"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <input
              type="number"
              min="0"
              value={row.amount}
              onChange={(e) => updateAmount(row.id, e.target.value)}
              placeholder="₹0"
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm tabular-nums outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label={`Remove ${row.category || "row"}`}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <Button type="button" variant="ghost" size="sm" onClick={addRow} className="mt-3">
        + Add category
      </Button>

      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-semibold text-slate-900">Total</span>
        <span className="text-xl font-semibold tabular-nums text-slate-900">
          ₹{total(rows).toLocaleString("en-IN")}
        </span>
      </div>
    </Card>
  );
}
