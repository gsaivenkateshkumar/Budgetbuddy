import { redirect } from "next/navigation";

/**
 * Retired product-comparison route (Budget Buddy -> Start Currency
 * pivot). Kept as a redirect rather than a 404 for anyone who has it
 * bookmarked or indexed — forwards to the closest equivalent in the new
 * product: the deterministic business calculators. The comparison
 * components/services this route used to render (ComparisonTable,
 * PriorityControls, ProductPicker, the recommendation engine) have been
 * deleted as unused.
 */
export default function ComparePage() {
  redirect("/tools");
}
