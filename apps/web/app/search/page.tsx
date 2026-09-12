import { redirect } from "next/navigation";

/**
 * Retired shopping-comparison route (Budget Buddy -> Start Currency
 * pivot). Kept as a redirect rather than a 404 for anyone who has it
 * bookmarked or indexed — forwards to the nearest equivalent in the new
 * product: describing a business idea. The old product-search
 * components/services this route used to render (SearchFilters,
 * ProductCard, lib/api/products.ts) are retained but unused — see the
 * migration report for what's safe to delete later.
 */
export default function SearchPage() {
  redirect("/validate");
}
