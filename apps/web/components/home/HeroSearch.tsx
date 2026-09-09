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
          className="w-full flex-1 rounded-lg border border-slate-300 px-4 py-3 text-base text-slate-900 shadow-sm outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
        <button
          type="submit"
          className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Search
        </button>
      </form>

      <ul className="flex flex-wrap justify-center gap-2 pt-1">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <li key={prompt}>
            <a
              href={`/ask?q=${encodeURIComponent(prompt)}`}
              className="press-scale inline-block rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition hover:border-indigo-300 hover:text-indigo-700"
            >
              {prompt}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
