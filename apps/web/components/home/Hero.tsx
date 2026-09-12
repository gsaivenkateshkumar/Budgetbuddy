"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { FloatingPaths } from "@/components/ui/background-paths";
import { HeroSearch } from "./HeroSearch";
import { SITE_NAME } from "@/lib/siteConfig";

const HEADLINE_LINE_1 = "Turn your idea";
const HEADLINE_LINE_2 = "into a business.";

/** One headline line as word-by-word entrance spans. Deterministic delays
 * (index-based, no randomness) so SSR and the first client paint match. */
function AnimatedWords({ text, startDelay, accent = false }: { text: string; startDelay: number; accent?: boolean }) {
  const shouldReduceMotion = useReducedMotion();
  const words = text.split(" ");

  return (
    <span
      className={`block ${accent ? "bg-gradient-to-b from-white via-white to-violet-200 bg-clip-text text-transparent" : ""}`}
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="mr-[0.22em] inline-block last:mr-0"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: startDelay + i * 0.07, duration: 0.6, type: "spring", stiffness: 160, damping: 22 }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

export function Hero() {
  const shouldReduceMotion = useReducedMotion();
  const line1WordCount = HEADLINE_LINE_1.split(" ").length;
  const line2Delay = 0.15 + line1WordCount * 0.07;

  const fadeUp = (delay: number) => ({
    initial: shouldReduceMotion ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.5 },
  });

  return (
    <section
      id="home-hero"
      className="relative isolate min-h-[600px] overflow-hidden bg-[#07080A] px-4 py-20 sm:min-h-[680px] sm:px-6 sm:py-24 lg:min-h-[720px]"
    >
      <div aria-hidden="true" className="opacity-70 sm:opacity-100">
        <FloatingPaths position={1} />
        <FloatingPaths position={-1} />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center gap-8 text-center">
        <motion.p {...fadeUp(0)} className="text-sm font-semibold uppercase tracking-wide text-violet-300">
          {SITE_NAME} — AI Business Builder
        </motion.p>

        <h1 className="text-4xl font-extrabold leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl">
          <AnimatedWords text={HEADLINE_LINE_1} startDelay={0.15} />
          <AnimatedWords text={HEADLINE_LINE_2} startDelay={line2Delay} accent />
        </h1>

        <motion.p {...fadeUp(0.55)} className="max-w-2xl text-base text-slate-300 sm:text-lg">
          Validate your idea, plan your budget, build a launch roadmap, and manage your business with
          an AI copilot.
        </motion.p>

        <motion.div {...fadeUp(0.65)} className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/validate"
            className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_8px_30px_-8px_rgba(109,93,251,0.65)] transition hover:-translate-y-0.5 hover:bg-violet-500 active:translate-y-0"
          >
            Validate my idea
          </Link>
          <Link
            href="/plan"
            className="group inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-6 py-3 text-sm font-semibold text-white backdrop-blur-md transition hover:-translate-y-0.5 hover:bg-white/[0.10]"
          >
            Plan a business
            <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">
              &rarr;
            </span>
          </Link>
        </motion.div>

        <motion.div {...fadeUp(0.75)} className="w-full">
          <HeroSearch />
        </motion.div>

        <motion.p {...fadeUp(0.9)} className="text-xs text-slate-500">
          Start Currency is an AI business builder — not financial, legal, or tax advice.
        </motion.p>
      </div>
    </section>
  );
}
