import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { DecisionIntelligence } from "@/components/home/DecisionIntelligence";
import { GoalBasedShopping } from "@/components/home/GoalBasedShopping";
import { GuidesPreview } from "@/components/home/GuidesPreview";
import { HeroSearch } from "@/components/home/HeroSearch";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IntelligenceVisual } from "@/components/home/IntelligenceVisual";
import { TrustSection } from "@/components/home/TrustSection";
import { WhyBudgetBuddy } from "@/components/home/WhyBudgetBuddy";
import { LinkButton } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Reveal } from "@/components/motion/Reveal";
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
        <Container className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col items-center gap-8 text-center lg:items-start lg:text-left">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
                {SITE_NAME} — Your AI Shopping Buddy
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                {SITE_VALUE_PROP}
              </h1>
              <p className="max-w-xl text-base text-slate-600">
                Budget Buddy helps you compare products, prices, and trade-offs so you can make a
                better buying decision — not just find the cheapest listing.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <LinkButton href="/ask" variant="primary" size="lg">
                Ask Budget Buddy
              </LinkButton>
              <LinkButton href="/search" variant="outline" size="lg">
                Explore products
              </LinkButton>
            </div>

            <HeroSearch />
            <p className="text-xs text-slate-500">
              {SITE_NAME} is an AI-powered shopping comparison platform operated by {COMPANY_NAME}.
            </p>
          </div>

          <Reveal>
            <IntelligenceVisual />
          </Reveal>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <Reveal>
            <HowItWorks />
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <Reveal>
            <DecisionIntelligence />
          </Reveal>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <Reveal>
            <GoalBasedShopping />
          </Reveal>
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <Reveal>
            <WhyBudgetBuddy />
          </Reveal>
        </Container>
      </section>

      <section className="py-16">
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
              title="Product catalog is being expanded"
              body="We're connecting verified retailer sources so Budget Buddy can compare real products, prices, and offers without inventing catalog data."
              actions={
                <>
                  <LinkButton href="/ask" variant="primary" size="sm">
                    Ask Budget Buddy
                  </LinkButton>
                  <LinkButton href="/guides" variant="outline" size="sm">
                    Browse guides
                  </LinkButton>
                </>
              }
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

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <Reveal>
            <TrustSection />
          </Reveal>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <Reveal>
            <GuidesPreview />
          </Reveal>
        </Container>
      </section>
    </>
  );
}
