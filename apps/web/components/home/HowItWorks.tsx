import Link from "next/link";
import { Card } from "@/components/ui/Card";

const STAGES = [
  {
    label: "Validate",
    body: "Answer a few structured questions about your idea and get a scored, honest validation report.",
    href: "/validate",
    action: "Validate your idea",
  },
  {
    label: "Plan",
    body: "Build your business model, target customer, offer, and startup budget in one workspace.",
    href: "/plan",
    action: "Build the business model and budget",
  },
  {
    label: "Launch",
    body: "Follow a real, trackable launch roadmap — week by week, task by task.",
    href: "/business",
    action: "Follow an actionable roadmap",
  },
  {
    label: "Manage",
    body: "Record real revenue and expenses and see an honest financial summary, always from your own numbers.",
    href: "/business",
    action: "Track finances and operations",
  },
  {
    label: "Grow",
    body: "Ask Start Currency about pricing, hiring, and margins using your actual business context.",
    href: "/ask",
    action: "Use AI insights to improve",
  },
];

export function HowItWorks() {
  return (
    <div>
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-600">How it works</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900 sm:text-3xl">
          From idea to operating business.
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          One workspace that follows your business through every stage — not five disconnected tools.
        </p>
      </div>

      <div className="relative grid gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
        <div className="pointer-events-none absolute left-[10%] right-[10%] top-4 hidden h-px bg-violet-100 lg:block" aria-hidden="true" />
        {STAGES.map((stage, i) => (
          <Card key={stage.label} className="group relative flex h-full flex-col border-slate-200 p-5 transition-colors duration-150 hover:border-violet-300 lg:rounded-none lg:border-y-0 lg:border-l-0 lg:first:rounded-l-xl lg:first:border-l lg:last:rounded-r-xl lg:last:border-r">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-semibold text-white ring-8 ring-white transition-colors duration-150 group-hover:bg-teal-600">
              {i + 1}
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">0{i + 1}</p>
            <h3 className="mt-1 text-sm font-semibold text-slate-900">{stage.label}</h3>
            <p className="mt-1.5 flex-1 text-sm text-slate-600">{stage.body}</p>
            <Link href={stage.href} className="mt-4 text-xs font-medium text-violet-600 hover:text-violet-700">
              {stage.action} &rarr;
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
