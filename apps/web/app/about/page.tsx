import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { COMPANY_NAME, SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: { absolute: `About ${SITE_NAME} | ${COMPANY_NAME}` },
  description: `${SITE_NAME} is an AI-powered shopping comparison platform operated by ${COMPANY_NAME}, built to help consumers make better purchasing decisions.`,
};

export default function AboutPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">About {SITE_NAME}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {SITE_NAME} is an AI-powered shopping comparison platform operated by {COMPANY_NAME}.
          </p>
        </div>

        <Card className="flex flex-col gap-4 p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
          <p>
            {SITE_NAME} is an AI-powered product discovery and shopping comparison platform, developed
            and operated by {COMPANY_NAME}. Our goal is to help consumers make better purchasing
            decisions by bringing together product information, retailer options, prices,
            specifications, and shopping intelligence in one place.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            Independent, requirement-first recommendations
          </h2>
          <p>
            {SITE_NAME} is designed to remain retailer-independent. Organic recommendations are based
            on your stated requirements, product information, and overall value — not on which
            retailer or affiliate program a link happens to belong to. Where {SITE_NAME} may earn a
            commission from a purchase, that relationship is disclosed and never used to influence
            ranking. See our{" "}
            <a href="/affiliate-disclosure" className="font-medium text-indigo-600 hover:text-indigo-700">
              Affiliate Disclosure
            </a>{" "}
            for details.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">How recommendations work</h2>
          <p>
            Where {SITE_NAME} shows comparisons or recommendations, they are computed from structured
            product data — price, specifications, and available review signals — with the reasoning
            behind each result shown alongside it, rather than presented as an unexplained ranking.
            Ask Budget Buddy, our conversational assistant, answers using the same underlying catalog
            data and does not invent products, prices, or specifications it hasn&apos;t retrieved.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Where we are today</h2>
          <p>
            {SITE_NAME} is initially focused on Indian consumers, with wider retailer and category
            coverage planned over time. Retailer integrations and product coverage are actively being
            added — we&apos;d rather show you honestly what&apos;s available today than overstate our
            current catalog.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Questions</h2>
          <p>
            If you have a question about {SITE_NAME}, a product listing, or how we operate, visit our{" "}
            <a href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
              Contact page
            </a>
            .
          </p>
        </Card>
      </div>
    </Container>
  );
}
