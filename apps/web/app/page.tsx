import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HowItWorks } from "@/components/home/HowItWorks";
import { ValueProps } from "@/components/home/ValueProps";
import { WhyBudgetBuddy } from "@/components/home/WhyBudgetBuddy";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { listProducts } from "@/lib/api/products";
import { COMPANY_NAME, SITE_NAME, SITE_VALUE_PROP } from "@/lib/siteConfig";
import type { ProductSummary } from "@/lib/api/types";

async function getFeaturedProducts(): Promise<
  { products: ProductSummary[] } | { error: string }
> {
  try {
    const page = await listProducts({ page_size: 4, sort: "relevance" });
    return { products: page.items };
  } catch {
    return { error: "Couldn't load the catalog right now — the API may not be running." };
  }
}

export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-b from-indigo-50/60 to-white py-16 sm:py-24">
        <Container className="flex flex-col items-center gap-8 text-center">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
              {SITE_VALUE_PROP}
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              What are you trying to buy or accomplish?
            </h1>
            <p className="mx-auto max-w-xl text-base text-slate-600">
              Compare products, prices, specifications, and retailer options in one place. Get
              AI-powered recommendations based on your budget and requirements — not just the lowest
              price.
            </p>
          </div>
          <HeroSearch />
          <p className="text-xs text-slate-400">
            {SITE_NAME} is an AI-powered shopping comparison platform operated by {COMPANY_NAME}.
          </p>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <ValueProps />
        </Container>
      </section>

      <section className="border-t border-slate-200 py-16">
        <Container>
          <HowItWorks />
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Explore the catalog</h2>
            <Link href="/search" className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
              View all &rarr;
            </Link>
          </div>

          {"error" in featured ? (
            <ErrorState message={featured.error} />
          ) : featured.products.length === 0 ? (
            <EmptyState
              title="Live retailer integrations are being added"
              body={`${SITE_NAME} will surface supported merchant offers as they become available. In the meantime, try Ask Budget Buddy or browse our shopping guides.`}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featured.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </Container>
      </section>

      <section className="border-t border-slate-200 py-16">
        <Container>
          <WhyBudgetBuddy />
        </Container>
      </section>
    </>
  );
}
