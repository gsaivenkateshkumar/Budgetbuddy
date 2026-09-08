/**
 * Mirrors apps/api/app/schemas/*.py exactly. Keep in sync by hand until
 * packages/shared generates these from the backend's OpenAPI schema.
 *
 * Decimal fields (price, min_price, list_price) are serialized by FastAPI
 * as JSON strings, not numbers — parse with Number()/formatPriceINR only
 * at render time, never compare them as strings.
 */

export interface BrandRead {
  id: number;
  name: string;
  slug: string;
  logo_url: string | null;
  country: string | null;
}

export interface CategoryRead {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parent_id: number | null;
}

export interface OfferRead {
  retailer_slug: string;
  retailer_name: string;
  retailer_is_mock: boolean;
  product_url: string;
  seller_name: string | null;
  condition: string;
  price: string;
  list_price: string | null;
  currency: string;
  in_stock: boolean;
  availability_text: string | null;
  rating: number | null;
  review_count: number | null;
  source: string;
  collected_at: string;
  freshness: string;
  confidence: number;
}

export interface ImageRead {
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

export interface VariantRead {
  id: number;
  sku: string;
  name: string;
  mpn: string | null;
  gtin: string | null;
  upc: string | null;
  ean: string | null;
  specs: Record<string, unknown>;
  images: ImageRead[];
  offers: OfferRead[];
}

export interface ProductSummary {
  id: number;
  slug: string;
  name: string;
  brand: BrandRead;
  category: CategoryRead;
  primary_image_url: string | null;
  min_price: string | null;
  currency: string;
}

export interface ProductDetail extends ProductSummary {
  description: string | null;
  variants: VariantRead[];
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface CandidateEvidence {
  product_id: number;
  product_slug: string;
  product_name: string;
  brand_name: string;
  variant_id: number;
  variant_sku: string;
  specs: Record<string, unknown>;
  price: string;
  currency: string;
  in_stock: boolean;
  best_retailer_slug: string;
  offer_count: number;
  rating: number | null;
  review_count: number | null;
}

export interface ScoredCandidate {
  evidence: CandidateEvidence;
  sub_scores: Record<string, number>;
  total_score: number;
  rank: number;
  labels: string[];
  explanation: string[];
}

export interface RecommendationResult {
  hard_constraints: Record<string, unknown>;
  preferences: Record<string, number>;
  candidates: ScoredCandidate[];
  excluded_count: number;
}

export interface PriceHistoryPoint {
  price: string;
  list_price: string | null;
  in_stock: boolean;
  collected_at: string;
}

export interface PriceStats {
  current_price: string;
  lowest_recorded_price: string;
  highest_recorded_price: string;
  average_price: string;
  price_point_count: number;
  tracking_since: string;
  is_lowest_recorded: boolean;
  discount_from_list_pct: number | null;
}

export interface PriceHistoryResponse {
  retailer_slug: string;
  retailer_name: string;
  currency: string;
  points: PriceHistoryPoint[];
  stats: PriceStats;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}
