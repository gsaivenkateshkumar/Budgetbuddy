import type { OfferRead } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { buildRetailerLink } from "@/lib/retailerLink";

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
          <li
            key={`${offer.retailer_slug}-${offer.seller_name ?? "default"}`}
            className={`rounded-xl border p-4 ${
              isBest ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-white"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900">{offer.retailer_name}</span>
                  {offer.retailer_is_mock && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                      Demo
                    </span>
                  )}
                  {isBest && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      Lowest price
                    </span>
                  )}
                </div>
                {offer.seller_name && (
                  <p className="text-xs text-slate-500">Sold by {offer.seller_name}</p>
                )}
                <p className="mt-1 text-xs text-slate-400">{offer.freshness}</p>
              </div>

              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">
                  {formatPrice(offer.price, offer.currency)}
                </p>
                {offer.list_price && discount !== null && (
                  <p className="text-xs text-slate-400">
                    <span className="line-through">{formatPrice(offer.list_price, offer.currency)}</span>{" "}
                    <span className="text-emerald-600">{discount}% off list price</span>
                  </p>
                )}
                {!offer.in_stock && <p className="text-xs font-medium text-red-600">Out of stock</p>}
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
              className="mt-3 inline-block rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              View at {offer.retailer_name} &rarr;
            </a>
          </li>
        );
      })}
    </ul>
  );
}
