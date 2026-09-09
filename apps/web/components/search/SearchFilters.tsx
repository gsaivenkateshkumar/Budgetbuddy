"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { BrandRead, CategoryRead } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";

export function SearchFilters({
  categories,
  brands,
}: {
  categories: CategoryRead[];
  brands: BrandRead[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [brand, setBrand] = useState(searchParams.get("brand") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") ?? "");
  const [sort, setSort] = useState(searchParams.get("sort") ?? "relevance");

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (brand) params.set("brand", brand);
    if (minPrice) params.set("min_price", minPrice);
    if (maxPrice) params.set("max_price", maxPrice);
    if (sort !== "relevance") params.set("sort", sort);
    router.push(params.size > 0 ? `${pathname}?${params.toString()}` : pathname);
  }

  function clearFilters() {
    setQ("");
    setCategory("");
    setBrand("");
    setMinPrice("");
    setMaxPrice("");
    setSort("relevance");
    router.push(pathname);
  }

  return (
    <form onSubmit={applyFilters} className="flex flex-col gap-5 rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-q" className="text-xs font-medium text-slate-600">
          Search
        </label>
        <input
          id="filter-q"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Product or brand name"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-category" className="text-xs font-medium text-slate-600">
          Category
        </label>
        <select
          id="filter-category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-brand" className="text-xs font-medium text-slate-600">
          Brand
        </label>
        <select
          id="filter-brand"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option key={b.slug} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-min-price" className="text-xs font-medium text-slate-600">
            Min price
          </label>
          <input
            id="filter-min-price"
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filter-max-price" className="text-xs font-medium text-slate-600">
            Max price
          </label>
          <input
            id="filter-max-price"
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-sort" className="text-xs font-medium text-slate-600">
          Sort by
        </label>
        <select
          id="filter-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        >
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Button type="submit" variant="primary" className="w-full">
          Apply filters
        </Button>
        <Button type="button" variant="outline" className="w-full" onClick={clearFilters}>
          Clear all
        </Button>
      </div>
    </form>
  );
}
