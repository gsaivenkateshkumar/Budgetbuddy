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
              <LinkButton href="/tools" variant="ghost" size="sm" className="transition-none">
                View all tools &rarr;
              </LinkButton>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TOOLS.map((tool) => (
                <Card key={tool.name} className="p-5">
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

      <section className="py-16">
        <Container>
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-600 to-teal-600 px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
            <div>
              <h2 className="text-2xl font-semibold text-white">Ready to test your next venture?</h2>
              <p className="mt-1 max-w-xl text-sm text-violet-100">
                Start with validation — it&apos;s free, structured, and takes a few minutes.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href="/validate" variant="secondary" size="lg" className="!bg-white !text-violet-700 hover:!bg-violet-50">
                Start Free Validation &rarr;
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
