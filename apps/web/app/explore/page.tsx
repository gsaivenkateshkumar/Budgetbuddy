import { redirect } from "next/navigation";

/**
 * Retired shopping-comparison route (Budget Buddy -> Start Currency
 * pivot). Kept as a redirect rather than a 404 for anyone who has it
 * bookmarked or indexed.
 */
export default function ExplorePage() {
  redirect("/");
}
