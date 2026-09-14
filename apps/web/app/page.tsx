import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { GuidesPreview } from "@/components/home/GuidesPreview";
import { Hero } from "@/components/home/Hero";
import { HowItWorks } from "@/components/home/HowItWorks";
import { PopularStarters } from "@/components/home/PopularStarters";
import { TrustSection } from "@/components/home/TrustSection";
import { ValidationMethodology } from "@/components/home/ValidationMethodology";
import { WhyStartCurrency } from "@/components/home/WhyStartCurrency";
import { LinkButton } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const TOOLS = [
  { name: "Startup Budget Calculator", body: "Plan and allocate your available capital across real categories." },
  { name: "Break-even Calculator", body: "Find out how many units or how much revenue you need to break even." },
  { name: "Profit Margin Calculator", body: "See gross and operating margin from your actual revenue and costs." },
  { name: "Pricing Calculator", body: "Work out a minimum viable price from cost, margin, and fees." },
];

export default function HomePage() {
  return (
    <>
      <Hero />

      <section id="how-it-works" className="py-16">
        <Container>
          <HowItWorks />
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <ValidationMethodology />
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <PopularStarters />
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <div>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">Financial tools</h2>
              <LinkButton href="/tools" variant="ghost" size="sm">
                View all tools &rarr;
              </LinkButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.map((tool) => (
                <Card key={tool.name} hover className="p-5">
                  <h3 className="text-sm font-semibold text-slate-900">{tool.name}</h3>
                  <p className="mt-2 text-sm text-slate-600">{tool.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <WhyStartCurrency />
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-16">
        <Container>
          <TrustSection />
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <GuidesPreview />
        </Container>
      </section>

      <section className="border-t border-slate-200 bg-slate-900 py-16">
        <Container>
          <div className="flex flex-col items-center gap-4 text-center">
            <h2 className="text-2xl font-semibold text-white">Ready to turn your idea into a business?</h2>
            <p className="max-w-xl text-sm text-slate-300">
              Start with validation — it&apos;s free, structured, and takes a few minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href="/validate" variant="primary" size="lg">
                Validate my idea
              </LinkButton>
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-white/40"
              >
                Create an account
              </Link>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
