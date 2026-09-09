"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProductSummary } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";

export function ProductPicker({
  products,
  initialSelected,
}: {
  products: ProductSummary[];
  initialSelected: string[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function submit() {
    const params = new URLSearchParams();
    selected.forEach((slug) => params.append("product", slug));
    router.push(`/compare?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-slate-600">Select 2 or more products to compare.</p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {products.map((p) => (
          <label
            key={p.slug}
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 text-sm transition ${
              selected.has(p.slug)
                ? "border-indigo-400 bg-indigo-50"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selected.has(p.slug)}
                onChange={() => toggle(p.slug)}
                className="h-4 w-4 accent-indigo-600"
              />
              <span>
                <span className="block font-medium text-slate-900">{p.name}</span>
                <span className="block text-xs text-slate-500">{p.brand.name}</span>
              </span>
            </span>
            <span className="text-sm font-semibold text-slate-700">
              {p.min_price ? formatPrice(p.min_price, p.currency) : "—"}
            </span>
          </label>
        ))}
      </div>
      <Button type="button" disabled={selected.size < 2} onClick={submit} className="self-start">
        Compare selected ({selected.size})
      </Button>
    </div>
  );
}
