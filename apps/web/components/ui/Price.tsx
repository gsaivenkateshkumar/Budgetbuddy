import { formatPrice } from "@/lib/format";

const SIZES = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg font-semibold",
  xl: "text-2xl font-bold",
} as const;

/** Shared price display — tabular numerals so figures align cleanly in
 * tables/comparisons, and Indian-locale grouping/currency symbol via
 * formatPrice (₹12,999 / ₹1,25,000), never $ unless the source currency
 * genuinely requires it. */
export function Price({
  value,
  currency = "INR",
  size = "md",
  className = "",
  strikethrough = false,
}: {
  value: string | number;
  currency?: string;
  size?: keyof typeof SIZES;
  className?: string;
  strikethrough?: boolean;
}) {
  return (
    <span
      className={`tabular-nums text-slate-900 ${SIZES[size]} ${strikethrough ? "text-slate-500 line-through" : ""} ${className}`}
    >
      {formatPrice(value, currency)}
    </span>
  );
}
