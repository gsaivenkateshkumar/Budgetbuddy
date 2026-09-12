const EXAMPLE_PROMPTS = [
  { label: "Start with ₹50,000", idea: "I have ₹50,000. What business can I start?" },
  { label: "Validate my business idea", idea: "" },
  { label: "Build a 30-day launch plan", idea: "" },
  { label: "Calculate break-even", idea: "" },
];

const PROMPT_HREFS: Record<string, string> = {
  "Validate my business idea": "/validate",
  "Build a 30-day launch plan": "/plan",
  "Calculate break-even": "/tools",
};

export function HeroSearch() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <form action="/validate" method="GET" className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="hero-idea" className="sr-only">
          Describe the business you want to start
        </label>
        <input
          id="hero-idea"
          name="idea"
          type="text"
          placeholder="Describe the business you want to start…"
          className="w-full flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-base text-white shadow-sm outline-none backdrop-blur-md placeholder:text-slate-400 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Validate
        </button>
      </form>

      <ul className="flex flex-wrap justify-center gap-2 pt-1">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt.label}>
            <a
              href={PROMPT_HREFS[prompt.label] ?? `/validate?idea=${encodeURIComponent(prompt.idea)}`}
              className="press-scale inline-block rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
            >
              {prompt.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
