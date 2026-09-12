import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { BreakEvenCalculator } from "@/components/tools/BreakEvenCalculator";
import { MarginCalculator } from "@/components/tools/MarginCalculator";
import { PricingCalculator } from "@/components/tools/PricingCalculator";
import { StartupBudgetCalculator } from "@/components/tools/StartupBudgetCalculator";

export const metadata: Metadata = {
  title: "Business Tools",
  description: "Deterministic startup budget, break-even, margin, and pricing calculators.",
};

export default function ToolsPage() {
  return (
    <Container className="py-10">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Tools</h1>
        <p className="mt-2 text-sm text-slate-600">
          Real calculators, computed deterministically — no AI guessing at arithmetic. Sign in and
          create a business to save a budget that persists across sessions.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <StartupBudgetCalculator />
        <BreakEvenCalculator />
        <MarginCalculator />
        <PricingCalculator />
      </div>
    </Container>
  );
}
