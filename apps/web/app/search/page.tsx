import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { FilterDrawer } from "@/components/search/FilterDrawer";
import { Pagination } from "@/components/search/Pagination";
import { SearchFilters } from "@/components/search/SearchFilters";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { listBrands, listCategories, listProducts, type ProductSearchParams } from "@/lib/api/products";
import { GUIDES } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Explore products",
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isSortOption(value: string | undefined): value is NonNullable<ProductSearchParams["sort"]> {
  return value === "relevance" || value === "price_asc" || value === "price_desc";
}

type SearchPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams;

  const q = firstValue(resolvedParams.q);
  const category = firstValue(resolvedParams.category);
  const brand = firstValue(resolvedParams.brand);
  const minPrice = firstValue(resolvedParams.min_price);
  const maxPrice = firstValue(resolvedParams.max_price);
  const sortValue = firstValue(resolvedParams.sort);
  const sort = isSortOption(sortValue) ? sortValue : "relevance";
  const page = Math.max(1, Number(firstValue(resolvedParams.page)) || 1);
  const isFiltered = Boolean(q || category || brand || minPrice || maxPrice);

  const query: ProductSearchParams = {
    q,
    category,
    brand,
    min_price: minPrice,
    max_price: maxPrice,
    sort,
    page,
    page_size: 20,
  };

  const [productsResult, categoriesResult, brandsResult] = await Promise.allSettled([
    listProducts(query),
    listCategories(),
    listBrands(),
  ]);

  const urlParams = new URLSearchParams();
  if (q) urlParams.set("q", q);
  if (category) urlParams.set("category", category);
  if (brand) urlParams.set("brand", brand);
  if (minPrice) urlParams.set("min_price", minPrice);
  if (maxPrice) urlParams.set("max_price", maxPrice);
  if (sort !== "relevance") urlParams.set("sort", sort);

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Explore products</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <FilterDrawer>
          <SearchFilters
            categories={categoriesResult.status === "fulfilled" ? categoriesResult.value : []}
            brands={brandsResult.status === "fulfilled" ? brandsResult.value : []}
          />
        </FilterDrawer>

        <div>
          {productsResult.status === "rejected" ? (
            <ErrorState message="Couldn't load products right now — the API may not be running." />
          ) : productsResult.value.items.length === 0 ? (
            <div className="flex flex-col items-center gap-6 py-4">
              <EmptyState
                title={isFiltered ? "No products match your filters" : "Product catalog is being expanded"}
                body={
                  isFiltered
                    ? "Try widening your price range or clearing a filter."
                    : "We're connecting verified retailer sources so Budget Buddy can compare real products, prices, and offers without inventing catalog data."
                }
                actions={
                  <>
                    <LinkButton href="/ask" variant="primary" size="sm">
                      Ask Budget Buddy
                    </LinkButton>
                    <LinkButton href="/guides" variant="outline" size="sm">
                      Read buying guides
                    </LinkButton>
                  </>
                }
              />

              {!isFiltered && (
                <div className="w-full max-w-md border-t border-slate-100 pt-6">
                  <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                    While you wait
                  </p>
                  <div className="flex flex-col gap-2">
                    {GUIDES.slice(0, 2).map((guide) => (
                      <Link
                        key={guide.slug}
                        href={`/guides/${guide.slug}`}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
                      >
                        {guide.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {productsResult.value.total} result{productsResult.value.total === 1 ? "" : "s"}
              </p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {productsResult.value.items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <Pagination
                pathname="/search"
                params={urlParams}
                page={productsResult.value.page}
                totalPages={productsResult.value.total_pages}
              />
            </>
          )}
        </div>
      </div>
    </Container>
  );
}
