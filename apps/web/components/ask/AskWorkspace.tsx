import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { badgeClass } from "@/lib/ui";
import type { BusinessProject } from "@/lib/api/business";

const TOOL_LABELS: Record<string, string> = {
  get_business_project: "Looked up your business",
  get_business_budget: "Checked your budget",
  calculate_break_even: "Calculated break-even",
  calculate_margin: "Calculated margin",
  get_financial_summary: "Checked your financials",
  get_launch_tasks: "Checked your launch tasks",
  create_launch_task: "Added a launch task",
  update_launch_task: "Updated a launch task",
};

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  validation: "Validation",
  planning: "Planning",
  pre_launch: "Pre-launch",
  launched: "Launched",
  operating: "Operating",
};

export interface WorkspaceActivity {
  name: string;
  count: number;
}

/**
 * The right-hand "dynamic workspace" of the Ask Start Currency
 * conversational hub. Shows the user's real business context (never
 * fabricated) plus an honest activity trail built from the tool calls the
 * agent actually made this conversation.
 */
export function AskWorkspace({
  activity,
  business,
}: {
  activity: WorkspaceActivity[];
  business: BusinessProject | null;
}) {
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Your business</h2>
        {business ? (
          <div className="mt-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-900">{business.name}</span>
              <span className={badgeClass("info")}>{STAGE_LABELS[business.stage] ?? business.stage}</span>
            </div>
            {business.startup_budget && (
              <p className="text-xs text-slate-500">
                Startup budget: {business.currency} {business.startup_budget}
              </p>
            )}
            <LinkButton href={`/business/${business.id}`} variant="outline" size="sm" className="mt-1">
              Open workspace
            </LinkButton>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-slate-600">
              You don&apos;t have a business project yet — validate an idea to create one, and Start
              Currency can answer using your real numbers.
            </p>
            <LinkButton href="/validate" variant="outline" size="sm" className="mt-1">
              Validate an idea
            </LinkButton>
          </div>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Activity</h2>
        {activity.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            As you talk with Start Currency, what it looks up — your budget, tasks, and financials —
            will appear here.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {activity.map((item) => (
              <li key={item.name} className="message-in flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-500" aria-hidden="true" />
                  {TOOL_LABELS[item.name] ?? item.name}
                </span>
                {item.count > 1 && <span className="tabular-nums text-xs text-slate-500">×{item.count}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="px-1 text-xs text-slate-500">
        Start Currency is planning software, not financial, legal, or tax advice.
      </p>
    </div>
  );
}
