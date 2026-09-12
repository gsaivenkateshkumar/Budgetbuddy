"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { sendChatMessage, type ChatMessageIn } from "@/lib/api/ai";
import { listBusinesses, type BusinessProject } from "@/lib/api/business";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AskWorkspace, type WorkspaceActivity } from "./AskWorkspace";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: { name: string; arguments: Record<string, unknown> }[];
}

const TOOL_LABELS: Record<string, string> = {
  get_business_project: "Looked up your business",
  get_business_budget: "Checked your budget",
  calculate_break_even: "Calculated break-even",
  calculate_margin: "Calculated margin",
  get_financial_summary: "Checked your financials",
  get_launch_tasks: "Checked your launch tasks",
  create_launch_task: "Added a launch task",
  update_launch_task: "Updated a launch task",
};

const EXAMPLE_PROMPTS = [
  "Is my pricing sustainable?",
  "Can I afford to hire someone?",
  "What should I focus on this week?",
  "Create a launch checklist.",
];

export function AskChat({ initialQuery }: { initialQuery: string }) {
  const { user } = useAuth();
  const [input, setInput] = useState(initialQuery);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [business, setBusiness] = useState<BusinessProject | null>(null);
  const autoSent = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    listBusinesses()
      .then((list) => {
        if (!cancelled) setBusiness(list[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setBusiness(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || pending) return;

    setError(null);
    const nextMessages: DisplayMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const history: ChatMessageIn[] = messages.map((m) => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(trimmed, history, business?.id);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: response.reply, toolCalls: response.tool_calls },
      ]);
    } catch {
      setError("Something went wrong reaching Start Currency's AI. Please try again.");
    } finally {
      setPending(false);
    }
  }

  useEffect(() => {
    if (initialQuery && !autoSent.current) {
      autoSent.current = true;
      send(initialQuery);
    }
    // Auto-send only the initial query from a home-page link, once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, pending]);

  const activity = useMemo<WorkspaceActivity[]>(() => {
    const counts = new Map<string, number>();
    for (const message of messages) {
      for (const call of message.toolCalls ?? []) {
        counts.set(call.name, (counts.get(call.name) ?? 0) + 1);
      }
    }
    return Array.from(counts, ([name, count]) => ({ name, count }));
  }, [messages]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_3fr] lg:items-start">
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col">
          <div ref={scrollRef} className="flex max-h-[60vh] min-h-[320px] flex-col gap-4 overflow-y-auto p-5">
            {messages.length === 0 && !pending && (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-6 text-center">
                <p className="text-sm text-slate-500">
                  Ask about your pricing, budget, hiring, or launch plan — I&apos;ll use your real
                  business data and explain what I find.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => send(prompt)}
                      className="press-scale rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-violet-300 hover:text-violet-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`message-in flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-violet-600 text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {m.toolCalls.map((tc, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-white/70 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                        >
                          {TOOL_LABELS[tc.name] ?? tc.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start" role="status" aria-label="Start Currency is thinking">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex gap-2 border-t border-slate-200 p-4"
          >
            <label htmlFor="ask-input" className="sr-only">
              Message Start Currency
            </label>
            <input
              id="ask-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your business..."
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
            />
            <Button type="submit" disabled={pending}>
              Send
            </Button>
          </form>
        </Card>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      <AskWorkspace activity={activity} business={business} />
    </div>
  );
}
