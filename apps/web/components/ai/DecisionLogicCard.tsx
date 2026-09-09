import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export interface DecisionLogic {
  /** e.g. "Best value for your budget" — must come from real scoring/label
   * data (see app/services/recommendation/engine.py `_assign_labels`),
   * never a hardcoded claim. */
  badge?: string;
  pros: string[];
  tradeOffs: string[];
  /** Short explanation of why this was recommended — real backend
   * reasoning (e.g. ScoredCandidate.explanation), never invented copy. */
  reasoning?: string;
}

/**
 * Renders AI decision-logic output (pros / trade-offs / reasoning) for one
 * recommended product. This component only ever displays fields it is
 * given — it has no fallback/sample content, so it must only be rendered
 * once the backend actually supplies `DecisionLogic` data for a real
 * product. Do not call this with placeholder or fabricated data in any
 * production code path.
 */
export function DecisionLogicCard({ logic, productName }: { logic: DecisionLogic; productName: string }) {
  const hasContent = logic.pros.length > 0 || logic.tradeOffs.length > 0 || logic.reasoning;
  if (!hasContent) return null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900">{productName}</h3>
        {logic.badge && <Badge tone="success">{logic.badge}</Badge>}
      </div>

      {logic.reasoning && <p className="mt-3 text-sm text-slate-600">{logic.reasoning}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {logic.pros.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Pros</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {logic.pros.map((pro) => (
                <li key={pro} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-600" aria-hidden="true">
                    +
                  </span>
                  {pro}
                </li>
              ))}
            </ul>
          </div>
        )}
        {logic.tradeOffs.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-orange-700">Trade-offs</h4>
            <ul className="mt-2 flex flex-col gap-1.5">
              {logic.tradeOffs.map((tradeOff) => (
                <li key={tradeOff} className="flex gap-2 text-sm text-slate-700">
                  <span className="mt-0.5 text-orange-600" aria-hidden="true">
                    &minus;
                  </span>
                  {tradeOff}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
