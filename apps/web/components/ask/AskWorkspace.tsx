import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { UnbiasedNotice } from "@/components/ai/UnbiasedNotice";

const TOOL_LABELS: Record<string, string> = {
  search_products: "Searched the catalog",
  get_product_details: "Looked up product details",
  compare_products: "Compared products",
  get_prices: "Checked retailer prices",
};

export interface WorkspaceActivity {
  name: string;
  count: number;
}

/**
 * The right-hand "dynamic workspace" of the Ask Budget Buddy conversational
 * hub. It only ever shows two kinds of content: an honest onboarding state,
 * or a real activity trail built from the tool calls the agent actually
 * made this conversation (never fabricated products, prices, or
 * recommendations — see DecisionLogicCard for where real per-product
 * reasoning will render once the backend returns structured data).
 */
export function AskWorkspace({ activity }: { activity: WorkspaceActivity[] }) {
  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-20">
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Workspace</h2>

        {activity.length === 0 ? (
          <div className="mt-3 flex flex-col gap-2">
            <p className="text-sm text-slate-600">
              As you talk with Budget Buddy, what it looks up — criteria, comparisons, retailer
              checks — will appear here.
            </p>
            <p className="text-sm text-slate-500">
              Structured product recommendations will show up once a match is found in the
              catalog.
            </p>
          </div>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {activity.map((item) => (
              <li key={item.name} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 text-slate-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" aria-hidden="true" />
                  {TOOL_LABELS[item.name] ?? item.name}
                </span>
                {item.count > 1 && <span className="tabular-nums text-xs text-slate-500">×{item.count}</span>}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-900">Jump in directly</h2>
        <p className="mt-1 text-sm text-slate-600">
          Prefer to browse or compare yourself instead of chatting?
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <LinkButton href="/search" variant="outline" size="sm">
            Explore products
          </LinkButton>
          <LinkButton href="/compare" variant="outline" size="sm">
            Compare products
          </LinkButton>
        </div>
      </Card>

      <UnbiasedNotice className="px-1" />
      <p className="px-1 text-xs text-slate-500">
        Budget Buddy may earn a commission from qualifying purchases through outbound retailer
        links.{" "}
        <Link href="/affiliate-disclosure" className="font-medium text-indigo-600 hover:text-indigo-700">
          Learn more
        </Link>
        .
      </p>
    </div>
  );
}
