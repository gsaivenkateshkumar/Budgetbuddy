import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { COMPANY_NAME, CONTACT_EMAIL, SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: "Contact",
  description: `How to reach ${SITE_NAME}, operated by ${COMPANY_NAME}.`,
};

const SUPPORT_CATEGORIES = [
  {
    title: "General support",
    body: "Questions about using Budget Buddy, your account, or how a feature works.",
  },
  {
    title: "Retailer or product data issue",
    body: "Report incorrect pricing, a broken product page, or an outdated listing.",
  },
  {
    title: "Partnership or affiliate inquiry",
    body: "Retailer partnerships, affiliate programs, or business inquiries.",
  },
  {
    title: "Privacy inquiry",
    body: "Questions about your data, or a request to access or delete your account information.",
  },
];

export default function ContactPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{SITE_NAME}</h1>
          <p className="mt-1 text-sm text-slate-500">Operated by {COMPANY_NAME}</p>
        </div>

        <Card className="p-6">
          <h2 className="text-base font-semibold text-slate-900">Get in touch</h2>
          {CONTACT_EMAIL ? (
            <p className="mt-2 text-sm text-slate-700">
              Reach us at{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-violet-600 hover:text-violet-700">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-700">
              Our support contact is currently being finalized. In the meantime, please check back
              soon or reach out through any channel {SITE_NAME} has shared with you directly.
            </p>
          )}
        </Card>

        <div>
          <h2 className="text-base font-semibold text-slate-900">What can we help with?</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {SUPPORT_CATEGORIES.map((category) => (
              <Card key={category.title} className="p-4">
                <h3 className="text-sm font-semibold text-slate-900">{category.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{category.body}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
