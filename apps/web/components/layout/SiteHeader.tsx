"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "./Container";

const NAV_LINKS = [
  { href: "/validate", label: "Validate" },
  { href: "/plan", label: "Plan" },
  { href: "/business", label: "My Business" },
  { href: "/tools", label: "Tools" },
  { href: "/ask", label: "Ask AI" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();

  // Pathname-only: the homepage header is always dark, every other route is
  // always light. No scroll listener, no IntersectionObserver, no per-frame
  // state — a value this simple can't flicker.
  const dark = pathname === "/";
  const accountLink = {
    href: user ? "/account" : "/login",
    label: loading ? "You" : user ? (user.display_name || "You") : "Log in",
  };
  const links = [...NAV_LINKS, accountLink];

  return (
    <header
      className={`sticky top-0 z-50 border-b ${
        dark ? "border-white/10 bg-[#07080A]/95" : "border-slate-200 bg-white/95 shadow-sm backdrop-blur"
      }`}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className={`flex items-center gap-2 text-lg font-semibold transition-colors ${dark ? "text-white" : "text-slate-900"}`}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-xs font-bold text-white"
            aria-hidden="true"
          >
            SC
          </span>
          Start Currency
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {links.map((link) => {
              const active = isActive(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                      dark
                        ? active
                          ? "bg-white/10 text-violet-200"
                          : "text-slate-300 hover:bg-white/10 hover:text-white"
                        : active
                          ? "bg-violet-50 text-violet-700"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors md:hidden ${
            dark ? "text-slate-300 hover:bg-white/10" : "text-slate-600 hover:bg-slate-100"
          }`}
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
            aria-hidden="true"
          >
            {menuOpen ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
          </svg>
        </button>
      </Container>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Primary mobile"
          className={`border-t md:hidden ${dark ? "border-white/10 bg-[#07080A]" : "border-slate-200 bg-white"}`}
        >
          <Container>
            <ul className="flex flex-col py-2">
              {links.map((link) => {
                const active = isActive(pathname, link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={`block rounded-md px-3 py-3 text-base font-medium ${
                        dark
                          ? active
                            ? "bg-white/10 text-violet-200"
                            : "text-slate-300 hover:bg-white/10"
                          : active
                            ? "bg-violet-50 text-violet-700"
                            : "text-slate-700 hover:bg-slate-100"
                      }`}
                      onClick={() => setMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Container>
        </nav>
      )}
    </header>
  );
}
