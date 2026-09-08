const EXAMPLE_PROMPTS = [
  "Best laptop for programming under ₹70,000",
  "Best phone for photography under ₹60,000",
  "Compare iPhone and Galaxy",
  "I need equipment to start a T-shirt printing business",
];

export function HeroSearch() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <form action="/search" method="GET" className="flex flex-col gap-2 sm:flex-row" role="search">
        <label htmlFor="hero-search" className="sr-only">
          Search products
        </label>
        <input
          id="hero-search"
          name="q"
          type="search"
          placeholder="Search a product, e.g. &ldquo;MacBook Air M2&rdquo;"
          className="w-full flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        or ask in plain language
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <a
        href="/ask"
        className="flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
      >
        Ask Budget Buddy what you need
        <span aria-hidden="true">&rarr;</span>
      </a>

      <ul className="flex flex-wrap justify-center gap-2 pt-1">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <a
              href={`/ask?q=${encodeURIComponent(prompt)}`}
              className="inline-block rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              {prompt}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
