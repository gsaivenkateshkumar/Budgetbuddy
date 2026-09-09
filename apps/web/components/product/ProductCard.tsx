import Link from "next/link";
import type { ProductSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { Card } from "@/components/ui/Card";

/**
 * Product photography isn't wired up yet (seed/mock data uses
 * non-resolving placeholder URLs) — a stable initial-letter tile stands in
 * rather than a broken <img>, until real retailer/product imagery lands.
 */
function ProductImagePlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-t-xl bg-gradient-to-br from-indigo-50 to-slate-100 text-3xl font-semibold text-indigo-300"
      aria-hidden="true"
    >
      {label.charAt(0).toUpperCase()}
    </div>
  );
}

export function ProductCard({ product }: { product: ProductSummary }) {
  return (
    <Card hover className="group flex flex-col overflow-hidden">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <ProductImagePlaceholder label={product.name} />
        <div className="flex flex-1 flex-col gap-1 p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {product.brand.name}
            </span>
            <span className="text-xs text-slate-400">{product.category.name}</span>
          </div>
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 group-hover:text-indigo-700">
            {product.name}
          </h3>
          <div className="mt-auto flex items-end justify-between pt-2">
            {product.min_price ? (
              <p className="text-lg font-semibold text-slate-900">
                {formatPrice(product.min_price, product.currency)}
                <span className="ml-1 text-xs font-normal text-slate-400">onwards</span>
              </p>
            ) : (
              <p className="text-sm text-slate-400">No offers yet</p>
            )}
            <span className="text-xs font-medium text-indigo-600 opacity-0 transition group-hover:opacity-100">
              View details &rarr;
            </span>
          </div>
        </div>
      </Link>
    </Card>
  );
}
