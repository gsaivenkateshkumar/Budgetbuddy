export const SITE_NAME = "Budget Buddy";
export const SITE_TAGLINE = "AI Shopping Comparison & Recommendations";
// Marketing copy used on the homepage — kept separate from SITE_TAGLINE,
// which feeds page <title>s and shouldn't repeat the brand name in full.
export const SITE_VALUE_PROP = "Shop smarter with Budget Buddy.";
export const SITE_DESCRIPTION =
  "Budget Buddy is an AI-powered shopping comparison platform, operated by Promote, that compares products, prices, specifications, and retailer options to help you make better purchasing decisions.";

// Set NEXT_PUBLIC_SITE_URL once deployed (e.g. the Vercel production URL)
// so metadata, robots.txt, and the sitemap resolve absolute URLs correctly.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The company that builds and operates Budget Buddy. No legal suffix
// (Pvt Ltd / LLC / Inc) — none is established in project records, and
// none should be implied until it is.
export const COMPANY_NAME = "Promote";

// No real support inbox exists yet. Set NEXT_PUBLIC_CONTACT_EMAIL once one
// does — the Contact page and legal pages read this rather than a
// hardcoded/invented address. Until it's set, those pages show an honest
// "being finalized" message instead of a fabricated email.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;
