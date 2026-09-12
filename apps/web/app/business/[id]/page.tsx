"use client";

import { use, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  createFinancialEntry,
  generateRoadmap,
  getBudget,
  getBusiness,
  getFinancialSummary,
  getLatestValidation,
  listTasks,
  putBudget,
  updateTask,
  type Budget,
  type BusinessProject,
  type BusinessTask,
  type EntryType,
  type FinancialSummary,
  type TaskStatus,
  type ValidationReport,
} from "@/lib/api/business";

const STAGE_LABELS: Record<string, string> = {
  idea: "Idea",
  validation: "Validation",
  planning: "Planning",
  pre_launch: "Pre-launch",
  launched: "Launched",
  operating: "Operating",
};

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
}

function BudgetPanel({ businessId }: { businessId: number }) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [rows, setRows] = useState<{ category: string; amount: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getBudget(businessId).then((b) => {
      setBudget(b);
      setRows(b.items.length > 0 ? b.items.map((i) => ({ category: i.category, amount: i.amount })) : [{ category: "", amount: "" }]);
    });
  }, [businessId]);

  async function save() {
    setSaving(true);
    try {
      const items = rows.filter((r) => r.category.trim() && r.amount);
      const updated = await putBudget(businessId, items);
      setBudget(updated);
    } finally {
      setSaving(false);
    }
  }

  if (!budget) return null;

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Startup budget</h2>
      <div className="mt-4 flex flex-col gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={row.category}
              onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, category: e.target.value } : r)))}
              placeholder="Category"
              className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <input
              type="number"
              min="0"
              value={row.amount}
              onChange={(e) => setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, amount: e.target.value } : r)))}
              placeholder="₹0"
              className="w-32 rounded-lg border border-slate-300 px-3 py-2 text-right text-sm tabular-nums outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              aria-label="Remove row"
              onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" onClick={() => setRows((prev) => [...prev, { category: "", amount: "" }])}>
          + Add category
        </Button>
        <Button type="button" size="sm" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save budget"}
        </Button>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
        <span className="text-sm font-semibold text-slate-900">Total</span>
        <span className="text-lg font-semibold tabular-nums text-slate-900">₹{budget.total}</span>
      </div>
    </Card>
  );
}

function RoadmapPanel({ businessId }: { businessId: number }) {
  const [tasks, setTasks] = useState<BusinessTask[] | null>(null);
  const [generating, setGenerating] = useState(false);

  function refresh() {
    listTasks(businessId).then(setTasks);
  }

  useEffect(refresh, [businessId]);

  async function toggle(task: BusinessTask) {
    const next: TaskStatus = task.status === "completed" ? "pending" : "completed";
    const updated = await updateTask(businessId, task.id, { status: next });
    setTasks((prev) => prev?.map((t) => (t.id === task.id ? updated : t)) ?? null);
  }

  async function generate() {
    setGenerating(true);
    try {
      await generateRoadmap(businessId);
      refresh();
    } finally {
      setGenerating(false);
    }
  }

  if (!tasks) return null;

  const completed = tasks.filter((t) => t.status === "completed").length;
  const grouped = new Map<string, BusinessTask[]>();
  for (const task of tasks) {
    const key = task.week ? `Week ${task.week}` : "Other tasks";
    grouped.set(key, [...(grouped.get(key) ?? []), task]);
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Launch roadmap</h2>
        {tasks.length > 0 && (
          <span className="text-xs text-slate-500">
            {completed}/{tasks.length} done
          </span>
        )}
      </div>

      {tasks.length === 0 ? (
        <div className="mt-4 flex flex-col items-center gap-3 py-6 text-center">
          <p className="text-sm text-slate-600">No roadmap yet.</p>
          <Button type="button" size="sm" onClick={generate} disabled={generating}>
            {generating ? "Generating…" : "Generate a starter roadmap"}
          </Button>
        </div>
      ) : (
        <div className="mt-4 flex flex-col gap-4">
          {Array.from(grouped.entries()).map(([week, items]) => (
            <div key={week}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{week}</p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {items.map((task) => (
                  <li key={task.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={task.status === "completed"}
                      onChange={() => toggle(task)}
                      className="h-4 w-4 accent-violet-600"
                      aria-label={`Mark "${task.title}" ${task.status === "completed" ? "pending" : "completed"}`}
                    />
                    <span className={`text-sm ${task.status === "completed" ? "text-slate-400 line-through" : "text-slate-700"}`}>
                      {task.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function FinancialsPanel({ businessId, onChange }: { businessId: number; onChange: () => void }) {
  const [type, setType] = useState<EntryType>("revenue");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!amount || Number(amount) <= 0) {
      setError("Enter an amount greater than 0.");
      return;
    }
    setSaving(true);
    try {
      await createFinancialEntry(businessId, { type, amount, category: category || undefined, entry_date: date });
      setAmount("");
      setCategory("");
      onChange();
    } catch {
      setError("Couldn't save that entry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold text-slate-900">Add revenue or expense</h2>
      <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-4">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as EntryType)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        >
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
        </select>
        <input
          type="number"
          min="0"
          placeholder="Amount (₹)"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
        />
        <Button type="submit" disabled={saving} className="sm:col-span-4 sm:w-fit">
          {saving ? "Saving…" : `Add ${type}`}
        </Button>
      </form>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </Card>
  );
}

export default function BusinessWorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const businessId = Number(id);
  const { user, loading: authLoading } = useAuth();

  const [business, setBusiness] = useState<BusinessProject | null>(null);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [validation, setValidation] = useState<ValidationReport | null | "none">(null);
  const [error, setError] = useState<string | null>(null);
  const [tasksVersion, setTasksVersion] = useState(0);

  function loadSummary() {
    getFinancialSummary(businessId).then(setSummary).catch(() => {});
  }

  useEffect(() => {
    if (!user || Number.isNaN(businessId)) return;
    getBusiness(businessId)
      .then(setBusiness)
      .catch(() => setError("Couldn't load this business — it may not exist or belong to you."));
    loadSummary();
    getLatestValidation(businessId)
      .then(setValidation)
      .catch(() => setValidation("none"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, businessId, tasksVersion]);

  if (authLoading) return null;

  if (!user) {
    return (
      <Container className="py-16">
        <EmptyState
          title="Sign in to see this business"
          actions={
            <LinkButton href="/login" variant="primary" size="sm">
              Log in
            </LinkButton>
          }
        />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-16">
        <ErrorState message={error} />
      </Container>
    );
  }

  if (!business) return null;

  const isOperating = business.stage === "launched" || business.stage === "operating";

  return (
    <Container className="py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-slate-900">{business.name}</h1>
            <Badge tone="info">{STAGE_LABELS[business.stage] ?? business.stage}</Badge>
          </div>
          {business.description && <p className="mt-1 max-w-xl text-sm text-slate-600">{business.description}</p>}
        </div>
        <LinkButton href="/ask" variant="outline" size="sm">
          Ask about this business
        </LinkButton>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Startup budget"
          value={business.startup_budget ? `₹${business.startup_budget}` : "Not set"}
          hint={business.currency}
        />
        {isOperating ? (
          <>
            <StatCard label="Revenue" value={summary ? `₹${summary.total_revenue}` : "—"} />
            <StatCard label="Net result" value={summary ? `₹${summary.net_result}` : "—"} />
          </>
        ) : (
          <>
            <StatCard label="Stage" value={STAGE_LABELS[business.stage] ?? business.stage} hint="Not launched yet" />
            <StatCard
              label="Validation score"
              value={validation && validation !== "none" ? `${validation.scores.total}/100` : "Not run"}
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          {validation === "none" ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Validation</h2>
              <p className="mt-1 text-sm text-slate-600">No validation has been run yet for this business.</p>
              <LinkButton href={`/validate?idea=${encodeURIComponent(business.name)}`} variant="outline" size="sm" className="mt-3">
                Validate this idea
              </LinkButton>
            </Card>
          ) : validation ? (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-slate-900">Latest validation</h2>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-semibold tabular-nums text-slate-900">{validation.scores.total}/100</span>
                <Badge tone={validation.confidence === "High" ? "success" : validation.confidence === "Low" ? "danger" : "warning"}>
                  Confidence: {validation.confidence}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">{validation.verdict}</p>
            </Card>
          ) : null}

          <BudgetPanel businessId={businessId} />
        </div>

        <div className="flex flex-col gap-6">
          <RoadmapPanel businessId={businessId} />
          <FinancialsPanel businessId={businessId} onChange={() => setTasksVersion((v) => v + 1)} />
          {summary && summary.entry_count === 0 && (
            <p className="text-sm text-slate-500">No financial activity yet. Add your first revenue or expense entry above.</p>
          )}
        </div>
      </div>
    </Container>
  );
}
