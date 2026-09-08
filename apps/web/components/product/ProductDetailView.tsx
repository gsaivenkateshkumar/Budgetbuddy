"use client";

import { useMemo, useState } from "react";
import type { ProductDetail, VariantRead } from "@/lib/api/types";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { OffersTable } from "./OffersTable";

function variantLabel(variant: VariantRead): string {
  const parts: string[] = [];
  if (typeof variant.specs.ram_gb === "number") parts.push(`${variant.specs.ram_gb}GB RAM`);
  if (typeof variant.specs.storage_gb === "number") parts.push(`${variant.specs.storage_gb}GB`);
  if (typeof variant.specs.color === "string") parts.push(variant.specs.color);
  return parts.length > 0 ? parts.join(" / ") : variant.name;
}

export function ProductDetailView({ product }: { product: ProductDetail }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const variant = product.variants[selectedIndex];

  const bestOfferRetailerSlug = useMemo(() => {
    if (!variant || variant.offers.length === 0) return null;
    return variant.offers.reduce((best, offer) => (Number(offer.price) < Number(best.price) ? offer : best))
      .retailer_slug;
  }, [variant]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
          <span>{product.brand.name}</span>
          <span aria-hidden="true">&middot;</span>
          <span>{product.category.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{product.name}</h1>
        {product.description && (
          <p className="max-w-2xl text-sm text-slate-600">{product.description}</p>
        )}
      </div>

      {product.variants.length > 1 && (
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Choose a variant
          </h2>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Product variants">
            {product.variants.map((v, i) => (
              <button
                key={v.id}
                type="button"
                role="tab"
                aria-selected={i === selectedIndex}
                onClick={() => setSelectedIndex(i)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  i === selectedIndex
                    ? "border-indigo-600 bg-indigo-600 text-white"
                    : "border-slate-300 text-slate-700 hover:border-indigo-300"
                }`}
              >
                {variantLabel(v)}
              </button>
            ))}
          </div>
        </div>
      )}

      {variant && (
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          <div className="flex flex-col gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Specifications</h2>
              {Object.keys(variant.specs).length === 0 ? (
                <p className="text-sm text-slate-400">No structured specifications available.</p>
              ) : (
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  {Object.entries(variant.specs).map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="capitalize text-slate-500">{key.replace(/_/g, " ")}</dt>
                      <dd className="text-slate-900">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {(variant.mpn || variant.gtin || variant.upc || variant.ean) && (
                <p className="mt-3 text-xs text-slate-400">
                  {variant.mpn && <>MPN: {variant.mpn} </>}
                  {variant.gtin && <>GTIN: {variant.gtin} </>}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={`/compare?product=${product.slug}`}
                className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700"
              >
                Compare with alternatives
              </a>
              <a
                href={`/ask?q=${encodeURIComponent(`Is the ${product.name} a good choice for me?`)}`}
                className="rounded-md bg-indigo-50 px-4 py-2 text-center text-sm font-medium text-indigo-700 hover:bg-indigo-100"
              >
                Ask Budget Buddy about this product
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Retailer offers</h2>
              <DemoDataBadge />
            </div>
            {variant.offers.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                No retailer offers found for this variant yet.
              </p>
            ) : (
              <OffersTable offers={variant.offers} bestOfferRetailerSlug={bestOfferRetailerSlug} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
