import type { OfferRead } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { buildRetailerLink } from "@/lib/retailerLink";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Price } from "@/components/ui/Price";

function discountPercent(offer: OfferRead): number | null {
  if (!offer.list_price) return null;
  const list = Number(offer.list_price);
  const price = Number(offer.price);
  if (!(list > price)) return null;
  return Math.round((1 - price / list) * 100);
}

export function OffersTable({
  offers,
  bestOfferRetailerSlug,
}: {
  offers: OfferRead[];
  bestOfferRetailerSlug: string | null;
}) {
  const sorted = [...offers].sort((a, b) => Number(a.price) - Number(b.price));

  return (
    <ul className="flex flex-col gap-3">
      {sorted.map((offer) => {
        const discount = discountPercent(offer);
        const isBest = offer.retailer_slug === bestOfferRetailerSlug;

        return (
          <li key={`${offer.retailer_slug}-${offer.seller_name ?? "default"}`}>
            <Card className={`p-4 ${isBest ? "border-emerald-300 bg-emerald-50/40" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{offer.retailer_name}</span>
                    {isBest && <Badge tone="success">Lowest price</Badge>}
                  </div>
                  {offer.seller_name && (
                    <p className="text-xs text-slate-500">Sold by {offer.seller_name}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-500">{offer.freshness}</p>
                </div>

                <div className="text-right">
                  <Price value={offer.price} currency={offer.currency} size="lg" />
                  {offer.list_price && discount !== null && (
                    <p className="text-xs text-slate-500">
                      <span className="tabular-nums line-through">
                        {formatPrice(offer.list_price, offer.currency)}
                      </span>{" "}
                      <span className="tabular-nums text-emerald-600">{discount}% off list price</span>
                    </p>
                  )}
                  {!offer.in_stock && (
                    <p className="text-xs font-medium text-red-600">Out of stock</p>
                  )}
                  {offer.rating !== null && (
                    <p className="text-xs text-slate-500">
                      {offer.rating.toFixed(1)}&#9733; ({offer.review_count ?? 0})
                    </p>
                  )}
                </div>
              </div>

              <a
                href={buildRetailerLink(offer.product_url)}
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
              >
                Buy at {offer.retailer_name} &rarr;
              </a>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
