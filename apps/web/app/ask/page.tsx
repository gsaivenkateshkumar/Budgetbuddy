import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { AskChat } from "@/components/ask/AskChat";
import { LinkButton } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { getAIStatus } from "@/lib/api/ai";

export const metadata: Metadata = {
  title: { absolute: "Ask Start Currency" },
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
        <ErrorState message="Couldn't reach Start Currency's server right now." />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="flex flex-col gap-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Ask Start Currency</h1>
          <p className="mt-2 text-sm text-slate-600">
            Your AI business copilot. Ask about pricing, budget, hiring, or your launch plan — it
            answers using your real business data, and says so honestly when it doesn&apos;t have
            enough information yet.
          </p>
        </div>

        {status.configured ? (
          <AskChat initialQuery={initialQuery} />
        ) : (
          <div className="mx-auto max-w-2xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-800">
            <p className="font-medium">AI features aren&apos;t configured on this server yet.</p>
            <p className="mt-1">Validation and the calculators still work in the meantime.</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <LinkButton href="/validate" variant="primary" size="sm">
                Validate an idea
              </LinkButton>
              <LinkButton href="/tools" variant="outline" size="sm">
                Tools
              </LinkButton>
            </div>
          </div>
        )}
      </div>
    </Container>
  );
}
