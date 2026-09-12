import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/motion/Reveal";
import { GUIDES, readingTimeMinutes } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Business Guides",
  description:
    "Practical, original guides on validating a business idea, break-even, pricing, working capital, and planning your first 30 days.",
};

export default function GuidesPage() {
  return (
    <Container className="flex flex-col gap-8 py-10">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">Business guides</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Practical, original guides for validating and planning a business — written to help you
          think through the decision, not to guarantee an outcome.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {GUIDES.map((guide, i) => (
          <Reveal key={guide.slug} delayMs={Math.min(i, 4) * 40}>
            <Card hover className="p-5">
              <Link href={`/guides/${guide.slug}`} className="flex flex-col gap-2">
                <h2 className="text-sm font-semibold text-slate-900">{guide.title}</h2>
                <p className="text-sm text-slate-600">{guide.description}</p>
                <p className="text-xs text-slate-500">{readingTimeMinutes(guide)} min read</p>
              </Link>
            </Card>
          </Reveal>
        ))}
      </div>
    </Container>
  );
}
