"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const rafRef = useRef<number | null>(null);
  const isHomepage = pathname === "/";

  // Only the homepage has a dark hero (#home-hero in Hero.tsx) — everywhere
  // else the header stays in its normal light state regardless of scroll.
  // Defaulting to `isHomepage` means SSR/first paint already renders the
  // correct state (dark at scrollY 0 on "/"), no post-hydration flash.
  const [overDarkHero, setOverDarkHero] = useState(isHomepage);

  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        if (isHomepage) {
          const hero = document.getElementById("home-hero");
          setOverDarkHero(hero ? hero.getBoundingClientRect().bottom > 80 : false);
        }
        rafRef.current = null;
      });
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHomepage]);

  const dark = isHomepage && overDarkHero;
  const accountLink = {
    href: user ? "/account" : "/login",
    label: loading ? "You" : user ? (user.display_name || "You") : "Log in",
  };
  const links = [...NAV_LINKS, accountLink];

  return (
    <header
      className={`site-header sticky top-0 z-40 border-b backdrop-blur transition-colors ${
        dark
          ? "border-white/10 bg-[#101c20]/95 backdrop-blur-xl"
          : scrolled
            ? "border-slate-200 bg-white/95 shadow-sm"
            : "border-slate-200 bg-white/90"
      }`}
    >
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className={`flex items-center gap-2 text-lg font-semibold transition-colors ${dark ? "text-white" : "text-slate-900"}`}
        >
          <span
            className="brand-mark flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            bb.
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
          className={`border-t md:hidden ${dark ? "border-white/10" : "border-slate-200"}`}
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
