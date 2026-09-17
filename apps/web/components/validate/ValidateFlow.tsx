"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { createBusiness, validateBusiness, type ValidationReport } from "@/lib/api/business";
import { ValidationReportView } from "./ValidationReportView";

const DRAFT_KEY = "sc_validate_draft";

interface Draft {
  idea: string;
  description: string;
  industry: string;
  location: string;
  deliveryMode: "" | "online" | "offline" | "hybrid";
  startupBudget: string;
  experienceLevel: string;
  timeCommitment: string;
  targetCustomer: string;
  goals: string;
}

function emptyDraft(idea: string): Draft {
  return {
    idea,
    description: "",
    industry: "",
    location: "",
    deliveryMode: "",
    startupBudget: "",
    experienceLevel: "",
    timeCommitment: "",
    targetCustomer: "",
    goals: "",
  };
}

const STEPS = ["Your idea", "Market", "Budget & time", "Customer & goals"];

const CATEGORIES = [
  "Retail & Goods",
  "Manufacturing & Print",
  "Food & Beverage",
  "B2B Services",
  "Technology / SaaS",
  "Education & Content",
];

const STEP_TIPS: Record<number, { title: string; items: string[] }> = {
  0: {
    title: "What makes an effective idea summary?",
    items: [
      "What are you selling? Specify the concrete product, service, or offering.",
      "Who is it for? Pinpoint the specific audience you're starting with.",
      "Why choose you? Name the friction point your idea removes.",
    ],
  },
  1: {
    title: "Why market details help",
    items: [
      "A named category and location sharpen demand-evidence scoring.",
      "Online/offline/hybrid affects operational-feasibility assumptions.",
    ],
  },
  2: {
    title: "Why budget & experience matter",
    items: [
      "Startup budget drives capital-feasibility scoring directly.",
      "Experience and time commitment inform operational-risk confidence.",
    ],
  },
  3: {
    title: "Why customer & goals matter",
    items: [
      "A specific target customer sharpens differentiation scoring.",
      "Clear goals shape the recommended next actions in your report.",
    ],
  },
};

export function ValidateFlow({ initialIdea }: { initialIdea: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(initialIdea));
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [businessId, setBusinessId] = useState<number | null>(null);

  // Restore a draft saved before an unauthenticated user was sent to
  // register — never overwrite what they've already typed this session.
  useEffect(() => {
    if (!user) return;
    // Deferred a tick (not called synchronously in the effect body) so this
    // reads as a genuine async restore, not a render-time state adjustment.
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(DRAFT_KEY);
        if (saved) {
          setDraft((prev) => ({ ...prev, ...JSON.parse(saved) }));
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        // ignore malformed/unavailable storage
      }
    });
  }, [user]);

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function goToRegister() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // ignore
    }
    router.push("/register");
  }

  async function submit() {
    setError(null);
    setSubmitting(true);
    try {
      const business = await createBusiness({
        name: draft.idea,
        description: draft.description || undefined,
        industry: draft.industry || undefined,
        location: draft.location || undefined,
        delivery_mode: draft.deliveryMode || undefined,
        startup_budget: draft.startupBudget || undefined,
        experience_level: draft.experienceLevel || undefined,
        time_commitment: draft.timeCommitment || undefined,
        target_customer: draft.targetCustomer || undefined,
        goals: draft.goals || undefined,
      });
      setBusinessId(business.id);
      const validation = await validateBusiness(business.id);
      setReport(validation);
    } catch {
      setError("Couldn't validate your idea right now — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (report && businessId) {
    return (
      <div className="flex flex-col gap-6">
        <ValidationReportView report={report} />
        <div className="flex flex-wrap justify-center gap-3">
          <LinkButton href={`/business/${businessId}`} variant="primary" size="lg">
            Build my plan
          </LinkButton>
          <LinkButton href="/ask" variant="outline" size="lg">
            Ask about this idea
          </LinkButton>
        </div>
      </div>
    );
  }

  const canGoNext = step === 0 ? draft.idea.trim().length > 0 && draft.description.trim().length > 0 : true;

  const tips = STEP_TIPS[step];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div role="tablist" aria-label="Validation steps" className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-2">
        {STEPS.map((label, i) => (
          <div
            key={label}
            role="tab"
            aria-selected={i === step}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold sm:text-sm ${
              i === step ? "bg-violet-600 text-white" : i < step ? "text-violet-700" : "text-slate-500"
            }`}
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                i === step ? "bg-white/20" : i < step ? "bg-violet-100 text-violet-700" : "bg-slate-200"
              }`}
            >
              {i + 1}
            </span>
            {label}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[13fr_7fr]">
      <Card className="flex flex-col gap-4 p-6">
        {step === 0 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="idea" className="text-sm font-medium text-slate-700">
                What&apos;s your business idea?
              </label>
              <input
                id="idea"
                value={draft.idea}
                onChange={(e) => update("idea", e.target.value)}
                placeholder="e.g. Cloud kitchen for regional food"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-sm font-medium text-slate-700">
                Describe it in a bit more detail
              </label>
              <textarea
                id="description"
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
                rows={4}
                placeholder="What will you sell, to whom, and how?"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Industry / category (optional)</span>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => update("industry", cat)}
                    className={`rounded-lg border px-3 py-2 text-left text-xs font-medium transition ${
                      draft.industry === cat
                        ? "border-violet-600 bg-violet-50 text-violet-700"
                        : "border-slate-300 text-slate-700 hover:border-violet-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="location" className="text-sm font-medium text-slate-700">
                Location / market (optional)
              </label>
              <input
                id="location"
                value={draft.location}
                onChange={(e) => update("location", e.target.value)}
                placeholder="e.g. Bengaluru"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-slate-700">Online, offline, or hybrid?</span>
              <div className="flex flex-wrap gap-2">
                {(["online", "offline", "hybrid"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => update("deliveryMode", mode)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                      draft.deliveryMode === mode
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-slate-300 text-slate-700 hover:border-violet-300"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="budget" className="text-sm font-medium text-slate-700">
                Available startup budget in ₹ (optional)
              </label>
              <input
                id="budget"
                type="number"
                min="0"
                inputMode="decimal"
                value={draft.startupBudget}
                onChange={(e) => update("startupBudget", e.target.value)}
                placeholder="e.g. 80000"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="experience" className="text-sm font-medium text-slate-700">
                Experience level (optional)
              </label>
              <select
                id="experience"
                value={draft.experienceLevel}
                onChange={(e) => update("experienceLevel", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Select one</option>
                <option value="First-time">First-time founder</option>
                <option value="Some experience">Some experience</option>
                <option value="Experienced">Experienced / done this before</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="time" className="text-sm font-medium text-slate-700">
                Time commitment (optional)
              </label>
              <select
                id="time"
                value={draft.timeCommitment}
                onChange={(e) => update("timeCommitment", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              >
                <option value="">Select one</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time / side project</option>
              </select>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="customer" className="text-sm font-medium text-slate-700">
                Who&apos;s your target customer? (optional)
              </label>
              <textarea
                id="customer"
                value={draft.targetCustomer}
                onChange={(e) => update("targetCustomer", e.target.value)}
                rows={3}
                placeholder="Who has this problem, and why would they pay for your solution?"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="goals" className="text-sm font-medium text-slate-700">
                What are your goals for this business? (optional)
              </label>
              <textarea
                id="goals"
                value={draft.goals}
                onChange={(e) => update("goals", e.target.value)}
                rows={3}
                placeholder="e.g. Break even in 6 months, replace my salary, grow to a second location"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))} disabled={!canGoNext}>
              Next
            </Button>
          ) : loading ? null : user ? (
            <Button type="button" onClick={submit} disabled={submitting || !canGoNext}>
              {submitting ? "Validating…" : "Validate my idea"}
            </Button>
          ) : (
            <Button type="button" onClick={goToRegister}>
              Create account to validate
            </Button>
          )}
        </div>
      </Card>

      <Card className="flex h-fit flex-col gap-4 p-6">
        <p className="text-sm font-semibold text-slate-900">{tips.title}</p>
        <ol className="flex flex-col gap-3">
          {tips.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm text-slate-600">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
                {i + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </Card>
      </div>

      {!loading && !user && (
        <p className="text-center text-xs text-slate-500">
          Your answers are saved — you&apos;ll pick up right where you left off after creating a free
          account.
        </p>
      )}
    </div>
  );
}
