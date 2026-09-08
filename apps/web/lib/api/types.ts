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

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    request_id: string;
  };
}
