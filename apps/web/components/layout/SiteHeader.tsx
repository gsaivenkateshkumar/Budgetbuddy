"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Container } from "./Container";

const NAV_LINKS = [
  { href: "/validate", label: "Validate" },
  { href: "/plan", label: "Plan" },
  { href: "/business", label: "My Business" },
  { href: "/tools", label: "Tools" },
  { href: "/ask", label: "Ask AI" },
];

// Sticky header height (h-16 below) — the IntersectionObserver rootMargin
// keeps this in sync with the boundary at which the hero visually passes
// under the header, so the two never drift out of sync.
const HEADER_HEIGHT_PX = 64;

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const isHomepage = pathname === "/";

  // Only the homepage has a dark hero (#home-hero in Hero.tsx) — everywhere
  // else the header stays in its normal light state. Defaulting to
  // `isHomepage` (a value already consistent between server and client,
  // unlike `document`/`IntersectionObserver` feature checks) means SSR/first
  // paint already renders the correct state for the common case, with no
  // post-hydration flash or mismatch.
  const [overDarkHero, setOverDarkHero] = useState(isHomepage);

  // IntersectionObserver instead of a scroll+rAF loop: no per-frame layout
  // reads, no polling, and the browser only notifies us on the one
  // transition we actually care about (the hero crossing under the header).
  useEffect(() => {
    if (!isHomepage) return;
    const hero = document.getElementById("home-hero");
    if (!hero || typeof IntersectionObserver === "undefined") {
      // Fail-safe: without observer support, default to the light header
      // rather than risk it staying stuck dark over light content. This is
      // a one-time corrective set on mount for a rare capability/DOM edge
      // case (mirrors Reveal's fail-safe), not a derived-state loop, so the
      // cascading-render concern the set-state-in-effect rule targets
      // doesn't apply here.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOverDarkHero(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setOverDarkHero(entry.isIntersecting),
      { rootMargin: `-${HEADER_HEIGHT_PX}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [isHomepage]);

  const dark = isHomepage && overDarkHero;
  const accountLink = {
    href: user ? "/account" : "/login",
    label: loading ? "You" : user ? (user.display_name || "You") : "Log in",
  };
  const links = [...NAV_LINKS, accountLink];

  return (
    <header
      className={`sticky top-0 z-40 border-b backdrop-blur transition-colors ${
        dark ? "border-white/10 bg-black/70 backdrop-blur-xl" : "border-slate-200 bg-white/95 shadow-sm"
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
          className={`border-t md:hidden ${dark ? "border-white/10 bg-black/70" : "border-slate-200 bg-white"}`}
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
