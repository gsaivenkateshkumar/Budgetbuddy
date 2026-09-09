"use client";

import { useMemo, useState } from "react";
import type { ProductDetail, VariantRead } from "@/lib/api/types";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";
import { OffersTable } from "./OffersTable";
import { PriceHistoryPanel } from "./PriceHistoryPanel";
import { ProductGallery } from "./ProductGallery";

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
                    ? "border-violet-600 bg-violet-600 text-white"
                    : "border-slate-300 text-slate-700 hover:border-violet-300"
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
            <ProductGallery images={variant.images} label={product.name} />

            <Card className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-slate-900">Specifications</h2>
              {Object.keys(variant.specs).length === 0 ? (
                <p className="text-sm text-slate-500">No structured specifications available.</p>
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
                <p className="mt-3 text-xs text-slate-500">
                  {variant.mpn && <>MPN: {variant.mpn} </>}
                  {variant.gtin && <>GTIN: {variant.gtin} </>}
                </p>
              )}
            </Card>

            <div className="flex flex-col gap-2">
              <LinkButton href={`/compare?product=${product.slug}`} variant="outline">
                Compare with alternatives
              </LinkButton>
              <LinkButton
                href={`/ask?q=${encodeURIComponent(`Is the ${product.name} a good choice for me?`)}`}
                variant="secondary"
              >
                Ask Budget Buddy about this product
              </LinkButton>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold text-slate-900">Available from</h2>
            {variant.offers.length === 0 ? (
              <Card className="border-dashed p-6 text-center text-sm text-slate-500">
                No retailer offers found for this variant yet.
              </Card>
            ) : (
              <>
                <OffersTable offers={variant.offers} bestOfferRetailerSlug={bestOfferRetailerSlug} />
                <p className="text-xs text-slate-500">
                  Budget Buddy may earn a commission from eligible purchases made through retailer
                  links, at no extra cost to you. See our{" "}
                  <a href="/affiliate-disclosure" className="underline hover:text-slate-600">
                    Affiliate Disclosure
                  </a>
                  .
                </p>
                <PriceHistoryPanel key={variant.sku} productSlug={product.slug} variantSku={variant.sku} />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
