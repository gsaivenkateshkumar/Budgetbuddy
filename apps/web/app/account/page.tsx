"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { useAuth } from "@/components/auth/AuthProvider";
import { listBusinesses, type BusinessProject } from "@/lib/api/business";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  validation: "Validation",
  planning: "Planning",
  pre_launch: "Pre-launch",
  launched: "Launched",
  operating: "Operating",
};

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState<BusinessProject[] | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) listBusinesses().then(setBusinesses).catch(() => setBusinesses([]));
  }, [user]);

  if (loading) {
    return (
      <Container className="flex flex-1 max-w-md flex-col justify-center py-16">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </Container>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <Container className="message-in flex flex-1 max-w-md flex-col justify-center gap-6 py-16">
      <h1 className="text-2xl font-semibold text-slate-900">Your account</h1>
      <div className="rounded-xl border border-slate-300 bg-white p-5 text-sm shadow-sm">
        <p className="text-slate-500">Signed in as</p>
        <p className="font-medium text-slate-900">{user.display_name || user.email}</p>
        <p className="text-slate-500">{user.email}</p>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-5 text-sm shadow-sm">
        <div className="flex items-center justify-between">
          <p className="font-medium text-slate-900">Your businesses</p>
          <LinkButton href="/validate" variant="ghost" size="sm">
            + New
          </LinkButton>
        </div>
        {businesses === null ? null : businesses.length === 0 ? (
          <p className="mt-2 text-slate-500">No businesses yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {businesses.map((b) => (
              <li key={b.id}>
                <a href={`/business/${b.id}`} className="flex items-center justify-between gap-2 hover:text-violet-700">
                  <span className="text-slate-900">{b.name}</span>
                  <Badge tone="neutral">{STAGE_LABELS[b.stage] ?? b.stage}</Badge>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-5 text-sm shadow-sm">
        <p className="font-medium text-slate-900">Plan</p>
        <p className="mt-1 text-slate-500">Free — one business project, standard AI usage.</p>
      </div>

      <Button
        type="button"
        variant="danger"
        className="self-start"
        onClick={() => {
          signOut();
          router.push("/");
        }}
      >
        Log out
      </Button>
    </Container>
  );
}
