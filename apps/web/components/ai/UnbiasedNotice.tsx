import Link from "next/link";

/** Shared trust microcopy for recommendation/outbound areas. Reuse this
 * instead of writing the disclosure text inline in multiple places. */
export function UnbiasedNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-slate-500 ${className}`}>
      Our picks are ranked independently of retailer commissions.{" "}
      <Link href="/affiliate-disclosure" className="font-medium text-violet-600 hover:text-violet-700">
        How we stay unbiased
      </Link>
    </p>
  );
}
