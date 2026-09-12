import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { DecisionIntelligence } from "@/components/home/DecisionIntelligence";
import { GoalBasedShopping } from "@/components/home/GoalBasedShopping";
import { GuidesPreview } from "@/components/home/GuidesPreview";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { TrustSection } from "@/components/home/TrustSection";
import { WhyBudgetBuddy } from "@/components/home/WhyBudgetBuddy";
import { LinkButton } from "@/components/ui/Button";
import { ProductCard } from "@/components/product/ProductCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Reveal } from "@/components/motion/Reveal";
import { listProducts } from "@/lib/api/products";
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
      <Hero />

      <section id="how-it-works" className="py-16">
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
            <Link href="/search" className="text-sm font-medium text-violet-600 hover:text-violet-700">
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
