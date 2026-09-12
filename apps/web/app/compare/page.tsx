import { redirect } from "next/navigation";

/**
 * Retired product-comparison route (Budget Buddy -> Start Currency
 * pivot). Kept as a redirect rather than a 404 for anyone who has it
 * bookmarked or indexed — forwards to the nearest equivalent in the new
 * product: the business planner. The old comparison components/services
 * (ComparisonTable, PriorityControls, ProductPicker, the recommendation
 * engine) are retained but unused — see the migration report for what's
 * safe to delete later.
 */
export default function ComparePage() {
  redirect("/plan");
}
