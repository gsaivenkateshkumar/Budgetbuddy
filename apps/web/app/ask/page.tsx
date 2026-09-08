import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { AskChat } from "@/components/ask/AskChat";
import { ErrorState } from "@/components/ui/ErrorState";
import { getAIStatus } from "@/lib/api/ai";

export const metadata: Metadata = {
  title: { absolute: "Ask Budget Buddy" },
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

type AskPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AskPage({ searchParams }: AskPageProps) {
  const resolved = await searchParams;
  const initialQuery = firstValue(resolved.q) ?? "";

  let status;
  try {
    status = await getAIStatus();
  } catch {
    return (
      <Container className="py-16">
        <ErrorState message="Couldn't reach Budget Buddy's server right now." />
      </Container>
    );
  }

  return (
    <Container className="flex flex-col gap-6 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Ask Budget Buddy</h1>
        <p className="mt-1 text-sm text-slate-600">
          Tell me what you&apos;re trying to buy or accomplish, and I&apos;ll help you compare options
          using Budget Buddy&apos;s catalog. I only answer with products, prices, and specs I can
          actually find — if the catalog doesn&apos;t have a match yet, I&apos;ll tell you honestly
          instead of guessing.
        </p>
      </div>

      {status.configured ? (
        <AskChat initialQuery={initialQuery} />
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <p className="font-medium">AI features aren&apos;t configured on this server yet.</p>
          <p className="mt-1">
            Search and comparison still work — try{" "}
            <a href="/search" className="underline">
              Explore
            </a>{" "}
            or{" "}
            <a href="/compare" className="underline">
              Compare
            </a>{" "}
            instead.
          </p>
        </div>
      )}
    </Container>
  );
}
