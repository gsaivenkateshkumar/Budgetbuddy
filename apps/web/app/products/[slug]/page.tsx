import { redirect } from "next/navigation";

/**
 * Retired product-detail route (Budget Buddy -> Start Currency pivot) —
 * there is no per-product equivalent in the new product, so this
 * forwards to the homepage rather than 404ing for any indexed/bookmarked
 * product URL. ProductDetailView and its child components have been
 * deleted as unused.
 */
export default function ProductDetailPage() {
  redirect("/");
}
