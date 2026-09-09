"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/Container";
import { Button, LinkButton } from "@/components/ui/Button";

export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="flex flex-col items-center gap-4 py-24 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Something went wrong</h1>
      <p className="max-w-md text-sm text-slate-600">
        An unexpected error occurred. You can try again, or head back to the home page.
      </p>
      <div className="flex gap-3">
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
        <LinkButton href="/" variant="outline">
          Go home
        </LinkButton>
      </div>
    </Container>
  );
}
