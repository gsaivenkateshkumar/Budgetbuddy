import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { COMPANY_NAME, SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: { absolute: `Affiliate Disclosure | ${SITE_NAME}` },
  description: `How ${SITE_NAME}, operated by ${COMPANY_NAME}, discloses affiliate relationships and how they relate to product recommendations.`,
};

export default function AffiliateDisclosurePage() {
  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Affiliate Disclosure</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
        </div>

        <Card className="flex flex-col gap-4 p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
          <p>
            {SITE_NAME} is operated by {COMPANY_NAME}. This page explains how {SITE_NAME} may
            participate in affiliate marketing and what that means for you as a reader.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Affiliate relationships</h2>
          <p>
            {SITE_NAME} may use affiliate networks — such as Cuelinks — and may participate in
            individual retailer affiliate programs, to earn a commission when you click certain
            merchant links and complete an eligible purchase or action. Not every link on {SITE_NAME}{" "}
            is an affiliate link, and not every affiliate relationship is active at all times.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">No extra cost to you</h2>
          <p>
            Where a link is an affiliate link, using it normally does not increase the price you pay.
            Any commission {COMPANY_NAME} may earn is paid by the retailer or affiliate network out of
            their own marketing budget, not added to your purchase price.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            Affiliate compensation does not determine rankings
          </h2>
          <p>
            Organic product recommendations and comparison rankings on {SITE_NAME} are computed from
            product data — price, specifications, and review signals — and are never adjusted based on
            whether a link is monetized or how much commission it may pay. Affiliate link selection is
            downstream of, and does not influence, our recommendation logic.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            Purchases happen on retailer websites
          </h2>
          <p>
            When you click through to a retailer, you leave {SITE_NAME} and complete your purchase on
            that retailer&apos;s own website. {SITE_NAME} does not sell, ship, or fulfil third-party
            retailer products. The retailer&apos;s own terms, pricing, returns, warranty, and delivery
            policies apply to that purchase — see our{" "}
            <a href="/terms" className="font-medium text-indigo-600 hover:text-indigo-700">
              Terms of Use
            </a>{" "}
            for more detail.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Current status</h2>
          <p>
            {SITE_NAME} has applied to affiliate networks, including Cuelinks, and is awaiting review.
            {" "}{SITE_NAME} is not currently an approved publisher of any affiliate network unless and
            until that approval is granted and confirmed, and no affiliate tracking is live on retailer
            links until that point.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">Questions</h2>
          <p>
            If you have questions about this disclosure, visit our{" "}
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
