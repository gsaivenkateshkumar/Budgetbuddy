import { redirect } from "next/navigation";

/**
 * Retired shopping-comparison route (Budget Buddy -> Start Currency
 * pivot). Kept as a redirect rather than a 404 for anyone who has it
 * bookmarked or indexed — forwards to the nearest equivalent in the new
 * product: describing a business idea. The components this route used to
 * render (SearchFilters, ProductCard) have been deleted as unused.
 */
export default function SearchPage() {
  redirect("/");
}
