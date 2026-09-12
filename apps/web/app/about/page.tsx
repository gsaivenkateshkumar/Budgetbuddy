import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { COMPANY_NAME, SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: { absolute: `About ${SITE_NAME} | ${COMPANY_NAME}` },
  description: `${SITE_NAME} is an AI business builder operated by ${COMPANY_NAME}, built to help people validate, plan, and manage a business.`,
};

export default function AboutPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">About {SITE_NAME}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {SITE_NAME} is an AI business builder and operating assistant, operated by {COMPANY_NAME}.
          </p>
        </div>

        <Card className="flex flex-col gap-4 p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
          <p>
            {SITE_NAME} helps people take a business idea from a rough thought to an operating
            business — validating the idea, planning the launch, budgeting startup costs, and
            tracking real revenue and expenses, with an AI copilot alongside every stage.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Structured data, not just a chatbot</h2>
          <p>
            Where {SITE_NAME} does arithmetic — break-even, margin, pricing, budgets — that math is
            computed by deterministic code, not guessed by an AI. Your business, budget, tasks, and
            financial entries persist as structured data in your account, so you never have to
            re-explain your business from scratch.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Honest validation</h2>
          <p>
            Idea validation reports are scored against a fixed, published set of dimensions —
            demand evidence, differentiation, business-model clarity, capital feasibility,
            operational feasibility, and go-to-market readiness. Where information is missing, the
            report says so and lowers its confidence, rather than inventing precision.
            {" "}{SITE_NAME} never claims a business will succeed.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">What this isn&apos;t</h2>
          <p>
            {SITE_NAME} is planning and operating software. It does not provide financial, legal,
            investment, or tax advice, and it does not guarantee profit, demand, or return on any
            business idea — confirm important decisions with a qualified professional.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Questions</h2>
          <p>
            If you have a question about {SITE_NAME} or how it works, visit our{" "}
            <a href="/contact" className="font-medium text-violet-600 hover:text-violet-700">
              Contact page
            </a>
            .
          </p>
        </Card>
      </div>
    </Container>
  );
}
