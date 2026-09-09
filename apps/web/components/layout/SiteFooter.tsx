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
      <Container className="flex flex-col gap-8 py-10 sm:flex-row sm:flex-wrap sm:items-start sm:gap-16">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600 text-[11px] font-bold text-white"
              aria-hidden="true"
            >
              BB
            </span>
            {SITE_NAME}
          </span>
          <span className="text-sm text-slate-500">Operated by {COMPANY_NAME}</span>
        </div>

        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:flex sm:flex-wrap sm:gap-x-6">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-slate-500 hover:text-slate-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>

      <Container className="border-t border-slate-200 py-4">
        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.
        </p>
      </Container>
    </footer>
  );
}
