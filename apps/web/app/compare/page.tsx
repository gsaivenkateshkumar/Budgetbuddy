import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ComparisonTable } from "@/components/compare/ComparisonTable";
import { PriorityControls } from "@/components/compare/PriorityControls";
import { ProductPicker } from "@/components/compare/ProductPicker";
import { DemoDataBadge } from "@/components/ui/DemoDataBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { compareProducts } from "@/lib/api/compare";
import { listProducts } from "@/lib/api/products";
import type { ProductSummary } from "@/lib/api/types";

export const metadata: Metadata = {
  title: "Compare products",
};

function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type ComparePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const resolved = await searchParams;
  const productSlugs = toArray(resolved.product);

  if (productSlugs.length < 2) {
    let products: ProductSummary[] = [];
    let loadError = false;
    try {
      products = (await listProducts({ page_size: 20 })).items;
    } catch {
      loadError = true;
    }

    return (
      <Container className="py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Compare products</h1>
        {loadError ? (
          <ErrorState message="Couldn't load the catalog right now — the API may not be running." />
        ) : products.length === 0 ? (
          <EmptyState title="No products available to compare yet" />
        ) : (
          <ProductPicker products={products} initialSelected={productSlugs} />
        )}
      </Container>
    );
  }

  const priorities = {
    price: Number(firstValue(resolved.price) ?? 40),
    performance: Number(firstValue(resolved.performance) ?? 30),
    reviews: Number(firstValue(resolved.reviews) ?? 20),
    battery: Number(firstValue(resolved.battery) ?? 10),
  };

  let result;
  try {
    result = await compareProducts(productSlugs, priorities);
  } catch {
    return (
      <Container className="py-16">
        <ErrorState message="Couldn't load the comparison right now — the API may not be running." />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Compare products</h1>
        <DemoDataBadge />
      </div>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <PriorityControls />

        <div>
          {result.candidates.length === 0 ? (
            <EmptyState
              title="None of the selected products could be compared"
              body="They may be missing price data."
            />
          ) : (
            <ComparisonTable candidates={result.candidates} />
          )}
        </div>
      </div>
    </Container>
  );
}
