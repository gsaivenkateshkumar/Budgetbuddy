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

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            1. Information you provide
          </h2>
          <p>
            If you create an account, we collect what you provide directly — such as your email
            address, display name, and password (stored as a securely hashed value, never in plain
            text). If you contact us, we collect what you include in that message.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">2. Account data</h2>
          <p>
            An account lets you save preferences and comparisons across sessions. You can request
            deletion of your account and associated data at any time — see Contact below.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            3. Technical and usage data
          </h2>
          <p>
            Like most web services, our servers and hosting providers automatically log standard
            technical data (such as IP address, browser type, device type, pages visited, and
            timestamps) for security, debugging, and reliability purposes.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">4. Cookies</h2>
          <p>
            {SITE_NAME} may use cookies or similar local storage to keep you signed in and remember
            basic preferences. Where third-party retailers or affiliate networks are involved in a
            purchase you initiate from {SITE_NAME} (see Section 6), they may separately set their own
            cookies once you leave our site.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">5. Analytics</h2>
          <p>
            We may use analytics tools to understand aggregate usage of {SITE_NAME} (such as which
            pages are visited) so we can improve the product. We do not sell this data.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            6. Affiliate marketing and attribution
          </h2>
          <p>
            {SITE_NAME} may participate in affiliate marketing programs, including networks such as
            Cuelinks (see our{" "}
            <a href="/affiliate-disclosure" className="font-medium text-indigo-600 hover:text-indigo-700">
              Affiliate Disclosure
            </a>
            ). When you click certain merchant links, the destination retailer or affiliate network may
            use cookies or similar tracking technologies of their own to attribute an eligible
            purchase back to that click. Data involved in this attribution may include information
            such as a click identifier, timestamp, referring page, and general browser/device context
            — typically in pseudonymous form, tied to the click rather than to your identity on{" "}
            {SITE_NAME}. We do not control, and are not responsible for, the privacy practices of
            third-party retailers or affiliate networks once you leave {SITE_NAME}.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            7. Third-party retailer redirects
          </h2>
          <p>
            Clicking a retailer link takes you to that retailer&apos;s own website, governed by their
            own privacy policy and terms. We encourage you to review those before completing a
            purchase.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">8. AI interactions</h2>
          <p>
            If you use Ask Budget Buddy, the messages you send are processed to generate a response
            (including, where relevant, queries against our product catalog) and may be sent to our
            AI service provider to generate that response. Conversation history for Ask Budget Buddy is
            currently held in your browser session, not stored server-side as a persistent chat log.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">9. Data retention</h2>
          <p>
            We retain account data for as long as your account is active, and technical/log data for a
            limited period as needed for security and debugging. You may request deletion at any time.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">10. Security</h2>
          <p>
            We use reasonable technical safeguards (such as encrypted connections and hashed
            passwords) to protect information. No online service can guarantee absolute security.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">
            11. Your rights and contact
          </h2>
          <p>
            You may request access to, correction of, or deletion of your personal data by contacting
            us — see our{" "}
            <a href="/contact" className="font-medium text-indigo-600 hover:text-indigo-700">
              Contact page
            </a>
            {CONTACT_EMAIL ? (
              <>
                {" "}or emailing{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-indigo-600 hover:text-indigo-700">
                  {CONTACT_EMAIL}
                </a>
              </>
            ) : null}
            . Where consent is legally or technically required for a particular use of cookies or
            tracking, we intend for the site to support appropriate consent management.
          </p>

          <h2 className="mt-2 text-base font-semibold text-slate-900">12. Policy updates</h2>
          <p>
            We may update this Privacy Policy from time to time. Material changes will be reflected by
            updating the &ldquo;Last updated&rdquo; date above.
          </p>
        </Card>
      </div>
    </Container>
  );
}
