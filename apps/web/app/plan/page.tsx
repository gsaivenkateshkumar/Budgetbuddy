"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "@/components/layout/Container";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { listBusinesses, updateBusiness, type BusinessProject } from "@/lib/api/business";

export default function PlanPage() {
  const { user, loading } = useAuth();
  const [businesses, setBusinesses] = useState<BusinessProject[] | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [businessModel, setBusinessModel] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [goals, setGoals] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    listBusinesses().then((list) => {
      setBusinesses(list);
      if (list.length > 0) {
        setSelectedId(list[0].id);
        setBusinessModel(list[0].business_model ?? "");
        setTargetCustomer(list[0].target_customer ?? "");
        setGoals(list[0].goals ?? "");
      }
    });
  }, [user]);

  function selectBusiness(b: BusinessProject) {
    setSelectedId(b.id);
    setBusinessModel(b.business_model ?? "");
    setTargetCustomer(b.target_customer ?? "");
    setGoals(b.goals ?? "");
    setSaved(false);
  }

  async function save() {
    if (!selectedId) return;
    setSaving(true);
    setSaved(false);
    try {
      await updateBusiness(selectedId, {
        business_model: businessModel || undefined,
        target_customer: targetCustomer || undefined,
        goals: goals || undefined,
        stage: "planning",
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Sign in to plan your business"
          actions={
            <LinkButton href="/login" variant="primary" size="sm">
              Log in
            </LinkButton>
          }
        />
      </Container>
    );
  }

  if (businesses !== null && businesses.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Validate an idea first"
          body="The planner builds on a validated business project — start there."
          actions={
            <LinkButton href="/validate" variant="primary" size="sm">
              Validate an idea
            </LinkButton>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <div className="mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Plan your business</h1>
        <p className="mt-2 text-sm text-slate-600">
          Define your offer and business model. Budget, break-even, and pricing live in Tools and your
          business workspace.
        </p>
      </div>

      {businesses && businesses.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {businesses.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => selectBusiness(b)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                selectedId === b.id
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-300 text-slate-700 hover:border-violet-300"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      )}

      <Card className="flex max-w-2xl flex-col gap-4 p-6">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="business-model" className="text-sm font-medium text-slate-700">
            Business model &mdash; what are you selling, and how do you make money?
          </label>
          <textarea
            id="business-model"
            value={businessModel}
            onChange={(e) => setBusinessModel(e.target.value)}
            rows={4}
            placeholder="e.g. Subscription meal plans sold direct via WhatsApp and Instagram, delivered daily."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="target-customer" className="text-sm font-medium text-slate-700">
            Target customer
          </label>
          <textarea
            id="target-customer"
            value={targetCustomer}
            onChange={(e) => setTargetCustomer(e.target.value)}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="plan-goals" className="text-sm font-medium text-slate-700">
            Goals for this business
          </label>
          <textarea
            id="plan-goals"
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            rows={3}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save plan"}
          </Button>
          {saved && <span className="text-sm text-teal-800">Saved.</span>}
        </div>
      </Card>

      {selectedId && (
        <div className="mt-6 flex max-w-2xl flex-wrap gap-3">
          <LinkButton href="/tools" variant="outline" size="sm">
            Budget &amp; break-even tools
          </LinkButton>
          <LinkButton href={`/business/${selectedId}`} variant="outline" size="sm">
            Open business workspace &amp; roadmap
          </LinkButton>
        </div>
      )}
    </Container>
  );
}
