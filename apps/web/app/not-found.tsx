import { Container } from "@/components/layout/Container";
import { LinkButton } from "@/components/ui/Button";

export default function RootNotFound() {
  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
      <p className="max-w-md text-sm text-slate-600">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <div className="flex gap-3">
        <LinkButton href="/" variant="primary">
          Go home
        </LinkButton>
        <LinkButton href="/search" variant="outline">
          Browse the catalog
        </LinkButton>
      </div>
    </Container>
  );
}
