import Link from "next/link";
import { Container } from "@/components/layout/Container";

export default function ProductNotFound() {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Product not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        We couldn&apos;t find a product with that identifier. It may have been removed, or the link is
        incorrect.
      </p>
      <Link
        href="/search"
        className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Browse the catalog
      </Link>
    </Container>
  );
}
