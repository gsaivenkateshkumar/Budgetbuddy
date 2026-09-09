import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { FilterDrawer } from "@/components/search/FilterDrawer";
import { Pagination } from "@/components/search/Pagination";
import { SearchFilters } from "@/components/search/SearchFilters";
import { ProductCard } from "@/components/product/ProductCard";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { listBrands, listCategories, listProducts, type ProductSearchParams } from "@/lib/api/products";

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
            <EmptyState
              title={
                q || category || brand || minPrice || maxPrice
                  ? "No products match your filters"
                  : "Live retailer integrations are being added"
              }
              body={
                q || category || brand || minPrice || maxPrice
                  ? "Try widening your price range or clearing a filter."
                  : "Budget Buddy will surface supported merchant offers as they become available."
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
