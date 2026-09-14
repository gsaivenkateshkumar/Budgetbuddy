import Link from "next/link";
import { HeroSearch } from "./HeroSearch";
import { SITE_NAME } from "@/lib/siteConfig";

const HEADLINE_LINE_1 = "Turn your idea";
const HEADLINE_LINE_2 = "into a business.";

export function Hero() {
  return (
    <section
      id="home-hero"
      className="relative isolate min-h-[600px] overflow-hidden bg-[#07080A] px-4 py-20 sm:min-h-[680px] sm:px-6 sm:py-24 lg:min-h-[720px]"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          {SITE_NAME} — AI Business Builder
        </p>

        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          <span className="block">{HEADLINE_LINE_1}</span>
          <span className="block bg-gradient-to-b from-white via-white to-violet-200 bg-clip-text text-transparent">
            {HEADLINE_LINE_2}
          </span>
        </h1>

        <p className="max-w-2xl text-base text-slate-300 sm:text-lg">
          Validate your idea, plan your budget, build a launch roadmap, and manage your business with
          an AI copilot.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/validate"
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_30px_-8px_rgba(109,93,251,0.65)] transition-colors hover:bg-violet-500"
          >
            Validate my idea
          </Link>
          <Link
            href="/plan"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.10]"
          >
            Plan a business
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>

        <div className="w-full">
          <HeroSearch />
        </div>

        <p className="text-xs text-slate-500">
          Start Currency is an AI business builder — not financial, legal, or tax advice.
        </p>
      </div>
    </section>
  );
}
