import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { ValidateFlow } from "@/components/validate/ValidateFlow";

export const metadata: Metadata = {
  title: "Validate your business idea",
  description: "Answer a few structured questions and get a scored, honest validation report for your business idea.",
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type ValidatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ValidatePage({ searchParams }: ValidatePageProps) {
  const resolved = await searchParams;
  const initialIdea = firstValue(resolved.idea) ?? "";

  return (
    <Container className="py-10">
      <div className="mx-auto mb-8 max-w-6xl">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">Business idea validation</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">Validate your business idea</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          A structured, honest validation report — not a guess. Scored against fixed dimensions, with
          confidence based on how much you&apos;ve told us.
        </p>
      </div>
      <ValidateFlow initialIdea={initialIdea} />
    </Container>
  );
}
