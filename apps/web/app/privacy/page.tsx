import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Card } from "@/components/ui/Card";
import { COMPANY_NAME, CONTACT_EMAIL, SITE_NAME } from "@/lib/siteConfig";

export const metadata: Metadata = {
  title: { absolute: `Privacy Policy | ${SITE_NAME}` },
  description: `How ${SITE_NAME}, operated by ${COMPANY_NAME}, collects, uses, and protects information.`,
};

export default function PrivacyPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">Privacy Policy</h1>
          <p className="mt-2 text-sm text-slate-500">Last updated: {new Date().getFullYear()}</p>
        </div>

        <Card className="flex flex-col gap-4 p-6 text-sm leading-relaxed text-slate-700 sm:p-8">
          <p>
            This Privacy Policy explains how {COMPANY_NAME}, the operator of {SITE_NAME} (&ldquo;we,&rdquo;
            &ldquo;us&rdquo;), handles information in connection with your use of {SITE_NAME}.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">1. Account information</h2>
          <p>
            If you create an account, we collect what you provide directly — your email address,
            display name, and password (stored as a securely hashed value, never in plain text).
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            2. Business and financial information you enter
          </h2>
          <p>
            {SITE_NAME} is built around the business information you choose to enter: your business
            idea and description, industry, location, startup budget, target customer, and similar
            planning details, plus any launch tasks, revenue entries, and expense entries you record.
            This information is private to your account. We do not sell it, and we do not display it
            to other users. You control what you enter — {SITE_NAME} never invents or infers financial
            figures on your behalf.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">3. Technical and usage data</h2>
          <p>
            Like most web services, our servers and hosting providers automatically log standard
            technical data (such as IP address, browser type, device type, pages visited, and
            timestamps) for security, debugging, and reliability purposes.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">4. Cookies and security services</h2>
          <p>
            {SITE_NAME} uses local browser storage to keep you signed in. Our login and registration
            pages use Cloudflare Turnstile, a bot-protection challenge, which may process limited
            technical signals (such as browser and network characteristics) under Cloudflare&apos;s own
            privacy policy to verify you&apos;re not an automated script.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">5. Analytics</h2>
          <p>
            We may use analytics tools to understand aggregate usage of {SITE_NAME} (such as which
            pages are visited) so we can improve the product. We do not sell this data.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">6. AI processing</h2>
          <p>
            Idea validation and Ask Start Currency send relevant details — your message, and, where
            you&apos;re signed in with a business project, structured context from that business (such
            as its budget, tasks, or financial summary) — to our AI service provider (currently Groq)
            to generate a response. We do not send more of your data than is needed to answer the
            specific request. Conversation history for Ask Start Currency is currently held in your
            browser session, not stored server-side as a persistent chat log; validation reports are
            stored with your business project so you can revisit them.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">7. Data retention</h2>
          <p>
            We retain account and business data for as long as your account is active, and
            technical/log data for a limited period as needed for security and debugging. You may
            request deletion at any time.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">8. Security</h2>
          <p>
            We use reasonable technical safeguards (such as encrypted connections, hashed passwords,
            and per-user access controls on business data) to protect information. No online service
            can guarantee absolute security.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">9. Your rights and contact</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data by contacting
            us — see our{" "}
            <a href="/contact" className="font-medium text-violet-600 hover:text-violet-700">
              Contact page
            </a>
            {CONTACT_EMAIL ? (
              <>
                {" "}or emailing{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-violet-600 hover:text-violet-700">
                  {CONTACT_EMAIL}
                </a>
              </>
            ) : null}
            .
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">10. Policy updates</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected by
            updating the &ldquo;Last updated&rdquo; date above.
          </p>
        </Card>
      </div>
    </Container>
  );
}
