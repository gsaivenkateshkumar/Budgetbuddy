import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { COMPANY_NAME, SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: `The terms governing use of ${SITE_NAME}, operated by ${COMPANY_NAME}.`,
};

export default function TermsPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Terms of Use</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
        </div>

        <div className="flex flex-col gap-4 text-sm leading-relaxed text-slate-700">
          <p>
            These Terms of Use (&ldquo;Terms&rdquo;) govern your use of {SITE_NAME}, operated by{" "}
            {COMPANY_NAME} (&ldquo;we,&rdquo; &ldquo;us&rdquo;). By using {SITE_NAME}, you agree to
            these Terms.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">1. What {SITE_NAME} is</h2>
          <p>
            {SITE_NAME} is a product discovery, comparison, and recommendation service. We help you
            research and compare products, prices, and retailer options, including through an
            AI-powered assistant. {SITE_NAME} is not a merchant or seller of the third-party products
            shown on the platform.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            2. Transactions happen on retailer websites
          </h2>
          <p>
            Any purchase you make is completed on the applicable retailer&apos;s own website, subject
            to that retailer&apos;s pricing, availability, terms, warranty, returns, and delivery
            policies. {SITE_NAME} is not a party to that transaction. Prices, availability, and product
            information can change at any time, including between when you view them on {SITE_NAME}{" "}
            and when you complete checkout on the retailer&apos;s site — the retailer&apos;s checkout
            price controls.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            3. Product and pricing information
          </h2>
          <p>
            We aim for product information, pricing, and specifications shown on {SITE_NAME} to be
            accurate and reasonably current, but we do not guarantee completeness or that every
            retailer, product, or offer is included. Verify product details, pricing, and availability
            directly with the retailer before purchasing.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            4. AI-generated recommendations
          </h2>
          <p>
            Ask Budget Buddy and other AI-powered features are informational aids intended to help you
            evaluate options. They are based on the product data available to {SITE_NAME} at the time,
            may not always be complete or fully up to date, and should not be treated as a guarantee of
            price, availability, or suitability for your specific needs. Use your own judgment,
            especially for significant purchases.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            5. Affiliate relationships
          </h2>
          <p>
            {SITE_NAME} may participate in affiliate marketing programs and may earn a commission from
            eligible purchases made through certain links, as described in our{" "}
            <a href="/affiliate-disclosure" className="font-medium text-indigo-600 hover:text-indigo-700">
              Affiliate Disclosure
            </a>
            . This does not affect the price you pay and does not influence organic recommendation
            rankings.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">6. Acceptable use</h2>
          <p>
            You agree not to misuse {SITE_NAME} — including attempting to disrupt the service,
            scraping or automating access outside of any published API, circumventing security
            measures, or using the service for unlawful purposes.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">7. No warranty</h2>
          <p>
            {SITE_NAME} is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis,
            without warranties of any kind, to the extent permitted by law. We do not guarantee
            uninterrupted or error-free operation.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            8. Limitation of liability
          </h2>
          <p>
            To the extent permitted by law, {COMPANY_NAME} is not liable for indirect, incidental, or
            consequential damages arising from your use of {SITE_NAME} or from a transaction completed
            with a third-party retailer. Nothing in these Terms limits liability that cannot be limited
            under applicable law.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">9. Changes to these Terms</h2>
          <p>
            We may update these Terms from time to time. Continued use of {SITE_NAME} after an update
            constitutes acceptance of the revised Terms.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">10. Contact</h2>
          <p>
            Questions about these Terms can be sent through our{" "}
            <a href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
              Contact page
            </a>
            .
          </p>
        </div>
      </div>
    </Container>
  );
}
