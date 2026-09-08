import { apiFetch } from "./client";
import type { BrandRead, CategoryRead, OfferRead, Page, ProductDetail, ProductSummary } from "./types";

export interface ProductSearchParams {
  q?: string;
  category?: string;
  brand?: string;
  min_price?: string | number;
  max_price?: string | number;
  sort?: "relevance" | "price_asc" | "price_desc";
  page?: number;
  page_size?: number;
}

function buildQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params) as [string, unknown][]) {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export function listProducts(params: ProductSearchParams = {}): Promise<Page<ProductSummary>> {
  return apiFetch<Page<ProductSummary>>(`/products${buildQuery(params)}`);
}

export function getProduct(slug: string): Promise<ProductDetail> {
  return apiFetch<ProductDetail>(`/products/${encodeURIComponent(slug)}`);
}

export function getVariantOffers(slug: string, sku: string): Promise<OfferRead[]> {
  return apiFetch<OfferRead[]>(
    `/products/${encodeURIComponent(slug)}/variants/${encodeURIComponent(sku)}/offers`
  );
}

export function listBrands(): Promise<BrandRead[]> {
  return apiFetch<BrandRead[]>("/brands");
}

export function listCategories(): Promise<CategoryRead[]> {
  return apiFetch<CategoryRead[]>("/categories");
}
