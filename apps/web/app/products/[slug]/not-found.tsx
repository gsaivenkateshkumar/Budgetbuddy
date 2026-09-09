import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";

export default function ProductNotFound() {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Product not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        We couldn&apos;t find a product with that identifier. It may have been removed, or the link is
        incorrect.
      </p>
      <LinkButton href="/search" variant="primary" className="mt-6">
        Browse the catalog
      </LinkButton>
    </Container>
  );
}
