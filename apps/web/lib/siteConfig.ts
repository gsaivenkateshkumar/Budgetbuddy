export const SITE_NAME = "Start Currency";
export const SITE_TAGLINE = "AI Business Builder & Operating Assistant";
// Marketing copy used on the homepage — kept separate from SITE_TAGLINE,
// which feeds page <title>s and shouldn't repeat the brand name in full.
export const SITE_VALUE_PROP = "Turn your idea into a business.";
export const SITE_DESCRIPTION =
  "Start Currency is an AI business builder, operated by Promote, that helps you validate a business idea, " +
  "plan your launch, budget your startup costs, and manage revenue and expenses with an AI copilot.";

// Set NEXT_PUBLIC_SITE_URL once deployed (e.g. the Vercel production URL)
// so metadata, robots.txt, and the sitemap resolve absolute URLs correctly.
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The company that builds and operates Start Currency. No legal suffix
// (Pvt Ltd / LLC / Inc) — none is established in project records, and
// none should be implied until it is.
export const COMPANY_NAME = "Promote";

// No real support inbox exists yet. Set NEXT_PUBLIC_CONTACT_EMAIL once one
// does — the Contact page and legal pages read this rather than a
// hardcoded/invented address. Until it's set, those pages show an honest
// "being finalized" message instead of a fabricated email.
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? null;

// Cloudflare Turnstile site key for the /login and /register CAPTCHA
// widgets — see .env.example for Cloudflare's published test keys (safe
// to share publicly; not secrets) for local development. No hardcoded
// fallback here: if unset, the login/register pages show an honest
// "security check unavailable" state rather than silently skipping
// CAPTCHA — the real check is enforced server-side regardless.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null;

// Default currency for new business projects — India-first, but every
// money field carries its own `currency` so this is a UI default, never
// a hardcoded assumption in calculations.
export const DEFAULT_CURRENCY = "INR";
