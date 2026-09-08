import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { ErrorState } from "@/components/ui/ErrorState";
import { ApiError } from "@/lib/api/client";
import { getProduct } from "@/lib/api/products";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await getProduct(slug);
    return {
      title: product.name,
      description:
        product.description ?? `Compare prices and retailer offers for ${product.name} on Budget Buddy.`,
    };
  } catch {
    return { title: "Product" };
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  let product;
  try {
    product = await getProduct(slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <Container className="py-16">
        <ErrorState message="Couldn't load this product right now — the API may not be running." />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <ProductDetailView product={product} />
    </Container>
  );
}
