import Link from "next/link";
import { HeroSearch } from "./HeroSearch";
import { SITE_NAME } from "@/lib/siteConfig";
import { HeroScene } from "@/components/three/HeroScene";

const HEADLINE_LINE_1 = "Turn your idea";
const HEADLINE_LINE_2 = "into a business.";

export function Hero() {
  return (
    <section
      id="home-hero"
      className="min-h-[600px] bg-[#07080A] px-4 py-16 sm:min-h-[680px] sm:px-6 sm:py-24 lg:min-h-[720px]"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 lg:grid-cols-[3fr_2fr]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-5 text-center sm:gap-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300 sm:text-sm">
            {SITE_NAME} — AI Business Builder
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
            <span className="block">{HEADLINE_LINE_1}</span>
            <span className="block text-violet-100">
              {HEADLINE_LINE_2}
            </span>
          </h1>

          <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Validate your idea, plan your budget, build a launch roadmap, and manage your business with
            an AI copilot.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/validate"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-violet-500 active:scale-[0.98]"
            >
              Validate my idea
            </Link>
            <Link
              href="/plan"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-white/[0.10] active:scale-[0.98]"
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
        <HeroScene />
      </div>
    </section>
  );
}
