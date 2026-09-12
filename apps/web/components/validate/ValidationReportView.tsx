import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import type { ValidationReport } from "@/lib/api/business";

const DIMENSION_LABELS: { key: keyof ValidationReport["scores"]; label: string; max: number }[] = [
  { key: "demand", label: "Demand evidence", max: 20 },
  { key: "differentiation", label: "Differentiation clarity", max: 15 },
  { key: "business_model", label: "Business-model clarity", max: 15 },
  { key: "capital", label: "Capital feasibility", max: 20 },
  { key: "operational", label: "Operational feasibility", max: 15 },
  { key: "gtm", label: "Go-to-market readiness", max: 15 },
];

const CONFIDENCE_TONE = { Low: "danger", Medium: "warning", High: "success" } as const;

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <div className="mt-1 text-sm text-slate-600">{children}</div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export function ValidationReportView({ report }: { report: ValidationReport }) {
  const { scores } = report;
  return (
    <div className="flex flex-col gap-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validation score</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-slate-900">{scores.total}/100</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge tone={CONFIDENCE_TONE[report.confidence]}>Confidence: {report.confidence}</Badge>
            <p className="max-w-xs text-right text-sm font-medium text-violet-700">{report.verdict}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DIMENSION_LABELS.map((dim) => (
            <div key={dim.key} className="rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{dim.label}</span>
                <span className="tabular-nums">
                  {scores[dim.key]}/{dim.max}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-violet-600"
                  style={{ width: `${(Number(scores[dim.key]) / dim.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {report.missing_info.length > 0 && (
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">What&apos;s missing (affects confidence):</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-5">
              {report.missing_info.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Card className="flex flex-col gap-5 p-6">
        <SectionBlock title="Business summary">{report.sections.business_summary}</SectionBlock>
        <SectionBlock title="Target customer">{report.sections.target_customer}</SectionBlock>
        <SectionBlock title="Problem being solved">{report.sections.problem_being_solved}</SectionBlock>
        <SectionBlock title="Revenue model">{report.sections.revenue_model}</SectionBlock>
        <SectionBlock title="Startup requirements">{report.sections.startup_requirements}</SectionBlock>
        <ListBlock title="Estimated cost areas" items={report.sections.estimated_cost_areas} />
        <SectionBlock title="Operational complexity">{report.sections.operational_complexity}</SectionBlock>
        <SectionBlock title="Competition considerations">{report.sections.competition_considerations}</SectionBlock>
        <SectionBlock title="Differentiation opportunities">
          {report.sections.differentiation_opportunities}
        </SectionBlock>
        <ListBlock title="Major risks" items={report.sections.major_risks} />
        <ListBlock title="Questions to validate further" items={report.sections.questions_to_validate} />
        <ListBlock title="Recommended next actions" items={report.sections.recommended_next_actions} />
      </Card>

      <p className="text-xs text-slate-500">
        This report is a planning estimate based on the information provided — not a guarantee of
        success, demand, or profitability, and not financial or legal advice.
      </p>
    </div>
  );
}
