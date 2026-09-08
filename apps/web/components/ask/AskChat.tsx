"use client";

import { useEffect, useRef, useState } from "react";
import { sendChatMessage, type ChatMessageIn } from "@/lib/api/ai";

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

export function AskChat({ initialQuery }: { initialQuery: string }) {
  const [input, setInput] = useState(initialQuery);
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoSent = useRef(false);

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[240px] flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {messages.length === 0 && !pending && (
          <p className="text-sm text-slate-400">
            Try: &ldquo;best laptop for programming under ₹70,000&rdquo; or &ldquo;compare iPhone and
            Galaxy&rdquo;.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-4 py-2 text-sm ${
                m.role === "user" ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-900"
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
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
        {pending && <p className="text-sm text-slate-400">Thinking…</p>}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2"
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
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:bg-slate-300"
        >
          Send
        </button>
      </form>
    </div>
  );
}
