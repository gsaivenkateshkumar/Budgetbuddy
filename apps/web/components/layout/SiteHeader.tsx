"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "./Container";

const NAV_LINKS = [
  { href: "/search", label: "Explore" },
  { href: "/compare", label: "Compare" },
  { href: "/ask", label: "Ask AI" },
  { href: "/guides", label: "Guides" },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const accountLink = {
    href: user ? "/account" : "/login",
    label: loading ? "You" : user ? (user.display_name || "You") : "Log in",
  };
  const links = [...NAV_LINKS, accountLink];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            BB
          </span>
          Budget Buddy
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
                      active ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
          className="flex h-10 w-10 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 md:hidden"
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
        <nav id="mobile-nav" aria-label="Primary mobile" className="border-t border-slate-200 md:hidden">
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
                        active ? "bg-indigo-50 text-indigo-700" : "text-slate-700 hover:bg-slate-100"
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
