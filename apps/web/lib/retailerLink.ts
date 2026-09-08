/**
 * Every outbound retailer link in the UI must be built with this function,
 * never a raw `offer.product_url` href — it's the single seam where
 * affiliate/deep-link tracking and click analytics can be added later
 * without rewriting call sites. See app/go/route.ts.
 */
export function buildRetailerLink(productUrl: string): string {
  return `/go?url=${encodeURIComponent(productUrl)}`;
}
