const EXAMPLE_PROMPTS = ["Laptop for college", "Phone under ₹30,000", "Home office setup", "Gaming setup"];

export function HeroSearch() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <form action="/search" method="GET" className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="hero-search" className="sr-only">
          What are you looking for?
        </label>
        <input
          id="hero-search"
          name="q"
          type="search"
          placeholder="What are you looking for? e.g. &ldquo;MacBook Air M2&rdquo;"
          className="w-full flex-1 rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-3 text-base text-white shadow-sm outline-none backdrop-blur-md placeholder:text-slate-400 focus:border-violet-400/60 focus:ring-2 focus:ring-violet-500/30"
        />
        <button
          type="submit"
          className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
        >
          Search
        </button>
      </form>

      <ul className="flex flex-wrap justify-center gap-2 pt-1">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <a
              href={`/ask?q=${encodeURIComponent(prompt)}`}
              className="press-scale inline-block rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:-translate-y-0.5 hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white"
            >
              {prompt}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
