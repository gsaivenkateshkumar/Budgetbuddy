import { redirect } from "next/navigation";

/**
 * Affiliate monetization is retired along with the shopping-comparison
 * product (Budget Buddy -> Start Currency pivot) — there is nothing left
 * to disclose, so this forwards to the homepage rather than continuing
 * to claim an affiliate relationship that no longer exists.
 */
export default function AffiliateDisclosurePage() {
  redirect("/");
}
