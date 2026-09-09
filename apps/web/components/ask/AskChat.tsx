"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { sendChatMessage, type ChatMessageIn } from "@/lib/api/ai";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AskWorkspace, type WorkspaceActivity } from "./AskWorkspace";

interface DisplayMessage {
  role: "user" | "assistant";
  content: string;
  toolCalls?: { name: string; arguments: Record<string, unknown> }[];
}

const TOOL_LABELS: Record<string, string> = {
  search_products: "Searched the catalog",
  get_product_details: "Looked up product details",
  compare_products: "Compared products",
  get_prices: "Checked retailer prices",
};

const EXAMPLE_PROMPTS = [
  "Best laptop for engineering under ₹60,000",
  "Phone with excellent camera and battery",
  "What do I need for a home office?",
  "Compare two products",
];

export function AskChat({ initialQuery }: { initialQuery: string }) {
  const [input, setInput] = useState(initialQuery);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSent = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
      const response = await sendChatMessage(trimmed, history);
      setMessages([
        ...nextMessages,
        { role: "assistant", content: response.reply, toolCalls: response.tool_calls },
      ]);
    } catch {
      setError("Something went wrong reaching Budget Buddy's AI. Please try again.");
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
                  Ask about a product, a budget, or a goal — I&apos;ll search Budget Buddy&apos;s catalog
                  and explain what I find.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => send(prompt)}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "rounded-br-sm bg-indigo-600 text-white"
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
              <div className="flex justify-start" role="status" aria-label="Budget Buddy is thinking">
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
              Message Budget Buddy
            </label>
            <input
              id="ask-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What are you trying to buy or accomplish?"
              className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
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

      <AskWorkspace activity={activity} />
    </div>
  );
}
