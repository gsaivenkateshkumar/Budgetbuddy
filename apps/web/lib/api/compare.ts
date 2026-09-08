import { apiFetch } from "./client";
import type { RecommendationResult } from "./types";

export interface ComparePriorities {
  price: number;
  performance: number;
  reviews: number;
  battery: number;
}

export function compareProducts(
  productSlugs: string[],
  priorities?: Partial<ComparePriorities>
): Promise<RecommendationResult> {
  const search = new URLSearchParams();
  for (const slug of productSlugs) {
    search.append("product", slug);
  }
  if (priorities) {
    for (const [key, value] of Object.entries(priorities)) {
      if (value !== undefined) search.set(key, String(value));
    }
  }
  return apiFetch<RecommendationResult>(`/compare?${search.toString()}`);
}
