"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LinkButton } from "@/components/ui/Button";
import { listBusinesses, type BusinessProject } from "@/lib/api/business";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  validation: "Validation",
  planning: "Planning",
  pre_launch: "Pre-launch",
  launched: "Launched",
  operating: "Operating",
};

export default function BusinessListPage() {
  const { user, loading } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessProject[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    listBusinesses()
      .then(setBusinesses)
      .catch(() => setError("Couldn't load your businesses right now."));
  }, [user]);

  if (loading) {
    return (
      <Container className="py-10">
        <div className="h-64 animate-pulse rounded-xl bg-slate-100" />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Sign in to see your business"
          body="Your businesses, budgets, and financials are private to your account."
          actions={
            <>
              <LinkButton href="/login" variant="primary" size="sm">
                Log in
              </LinkButton>
              <LinkButton href="/register" variant="outline" size="sm">
                Register
              </LinkButton>
            </>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">My business</h1>
        <LinkButton href="/validate" variant="primary" size="sm">
          + New business
        </LinkButton>
      </div>

      {error ? (
        <ErrorState message={error} />
      ) : businesses === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : businesses.length === 0 ? (
        <EmptyState
          title="You haven't created a business yet."
          body="Validate an idea to create your first business project."
          actions={
            <LinkButton href="/validate" variant="primary" size="sm">
              Validate an idea
            </LinkButton>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {businesses.map((b) => (
            <a key={b.id} href={`/business/${b.id}`}>
              <Card hover className="flex h-full flex-col gap-2 p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">{b.name}</span>
                  <Badge tone="info">{STAGE_LABELS[b.stage] ?? b.stage}</Badge>
                </div>
                {b.description && <p className="line-clamp-2 text-sm text-slate-600">{b.description}</p>}
              </Card>
            </a>
          ))}
        </div>
      )}
    </Container>
  );
}
