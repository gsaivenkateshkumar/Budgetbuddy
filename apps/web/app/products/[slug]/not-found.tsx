import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";

export default function ProductNotFound() {
  return (
    <Container className="py-20 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
        This page doesn&apos;t exist or may have moved.
      </p>
      <LinkButton href="/" variant="primary" className="mt-6">
        Go home
      </LinkButton>
    </Container>
  );
}
