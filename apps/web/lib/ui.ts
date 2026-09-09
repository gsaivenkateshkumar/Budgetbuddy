/** Shared className builders for the Button/Badge primitives — hand-rolled
 * instead of a variant-authoring library, since a few small maps cover the
 * whole surface this app needs.
 *
 * Color semantics (see docs/design-system.md):
 *   indigo  — AI / navigation / primary action / intelligence
 *   emerald — value, savings, positive/best-value outcomes
 *   orange  — commercial outbound actions only (an actual retailer link)
 *   red     — destructive actions only
 *   slate   — structure, secondary actions, neutral text
 */

const BASE_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";

/* Every variant carries a 1px border (transparent where there's no visible
 * border) so buttons of different variants placed side by side render at
 * the same height — a border-only variant like "outline" would otherwise
 * be 2px taller than a borderless one like "primary" at the same padding. */
const BUTTON_VARIANTS = {
  // Primary internal action: navigation, Compare, Ask Budget Buddy, Apply/Save.
  primary: "border border-transparent bg-indigo-600 text-white hover:bg-indigo-700 disabled:hover:bg-indigo-600",
  secondary: "border border-transparent bg-indigo-50 text-indigo-700 hover:bg-indigo-100",
  outline: "border border-slate-300 text-slate-700 hover:border-indigo-300 hover:text-indigo-700",
  ghost: "border border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  // Best-value / positive-outcome actions — savings, successful optimization.
  value: "border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 disabled:hover:bg-emerald-600",
  // Commercial outbound only — an actual retailer listing/redirect
  // ("View on Amazon", "Buy from Flipkart"). Never use where there is no
  // real outbound retailer link.
  commercial: "border border-transparent bg-orange-500 text-white hover:bg-orange-600 disabled:hover:bg-orange-500",
  // For destructive actions (e.g. log out, delete) — clearly interactive
  // and distinct from "primary", never ambiguous with a disabled state.
  danger: "border border-transparent bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600",
} as const;

const BUTTON_SIZES = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-sm",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;
export type ButtonSize = keyof typeof BUTTON_SIZES;

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", className = "") {
  return `${BASE_BUTTON} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${className}`.trim();
}

const BADGE_TONES = {
  neutral: "bg-slate-100 text-slate-600",
  info: "bg-indigo-50 text-indigo-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  // Legitimate commercial/action states only (e.g. a real price-drop).
  commercial: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
} as const;

export type BadgeTone = keyof typeof BADGE_TONES;

export function badgeClass(tone: BadgeTone = "neutral", className = "") {
  return `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]} ${className}`.trim();
}
