"use client";

import { useState } from "react";
import { BreakEvenCalculator } from "./BreakEvenCalculator";
import { MarginCalculator } from "./MarginCalculator";
import { PricingCalculator } from "./PricingCalculator";
import { StartupBudgetCalculator } from "./StartupBudgetCalculator";

const TABS = [
  { id: "budget", label: "Startup Budget", Component: StartupBudgetCalculator },
  { id: "break-even", label: "Break-Even", Component: BreakEvenCalculator },
  { id: "margin", label: "Profit Margin", Component: MarginCalculator },
  { id: "pricing", label: "Pricing", Component: PricingCalculator },
] as const;

export function ToolsTabs() {
  const [active, setActive] = useState<(typeof TABS)[number]["id"]>("budget");
  const Active = TABS.find((t) => t.id === active)!.Component;

  return (
    <div>
      <div role="tablist" aria-label="Calculators" className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active === tab.id ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <Active />
      </div>
    </div>
  );
}
