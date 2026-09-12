import { redirect } from "next/navigation";

/**
 * Retired product-detail route (Budget Buddy -> Start Currency pivot) —
 * there is no per-product equivalent in the new product, so this
 * forwards to the homepage rather than 404ing for any indexed/bookmarked
 * product URL. ProductDetailView and its child components (OffersTable,
 * PriceHistoryPanel, ProductGallery) are retained but unused — see the
 * migration report for what's safe to delete later.
 */
export default function ProductDetailPage() {
  redirect("/");
}
