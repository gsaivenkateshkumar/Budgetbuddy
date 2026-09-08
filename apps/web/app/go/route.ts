import { NextResponse, type NextRequest } from "next/server";

/**
 * Centralized outbound-retailer-link redirector. Every retailer link in
 * the UI points here (via lib/retailerLink.ts) instead of directly at the
 * retailer, so affiliate/deep-link tracking and click analytics
 * (RetailerSelected) can be added later without touching call sites.
 *
 * No tracking or affiliate tagging is applied yet — V1 has no affiliate
 * monetization, and organic rankings never depend on it (see
 * docs/product-decisions.md).
 */
export function GET(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url");
  if (!target) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  return NextResponse.redirect(parsed.toString());
}
