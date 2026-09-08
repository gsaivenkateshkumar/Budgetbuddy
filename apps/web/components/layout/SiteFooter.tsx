import Link from "next/link";
import { Container } from "./Container";
import { COMPANY_NAME, SITE_NAME } from "@/lib/siteConfig";

const FOOTER_LINKS = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/guides", label: "Guides" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
  { href: "/affiliate-disclosure", label: "Affiliate Disclosure" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <Container className="flex flex-col gap-6 py-10 text-sm text-slate-500">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-slate-900">{SITE_NAME}</span>
          <span>Operated by {COMPANY_NAME}</span>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-slate-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <p className="text-xs text-slate-400">
          &copy; {new Date().getFullYear()} {COMPANY_NAME}. {SITE_NAME} is operated by {COMPANY_NAME}.
        </p>
      </Container>
    </footer>
  );
}
