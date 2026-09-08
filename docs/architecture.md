# Architecture

## Overview

```
Browser → Next.js (apps/web) → FastAPI (apps/api) → PostgreSQL/SQLite
                                       │
                                       ├── AI provider (OpenAI/Anthropic, optional)
                                       └── Retailer adapters (mock/dev for now)
```

## Monorepo layout

- `apps/web` — Next.js (React, TypeScript, App Router) frontend.
- `apps/api` — FastAPI backend, modular monolith (service/repository layers,
  not microservices).
- `packages/shared` — TypeScript types shared between web and future
  clients.
- `docs/` — this documentation set.
- `scripts/` — dev/setup scripts.

## Backend structure (`apps/api/app`)

```
app/
├── main.py            FastAPI app: middleware, exception handlers, routers
├── core/
│   ├── config.py       Settings (env-var driven, pydantic-settings)
│   ├── database.py     SQLAlchemy engine/session (SQLite dev, Postgres prod)
│   ├── errors.py        AppError hierarchy + structured error responses
│   ├── logging.py       Structured logging setup
│   └── middleware.py    Request-ID middleware
├── api/routes/          FastAPI routers (thin HTTP layer)
├── services/            Business logic
├── repositories/        Data-access layer (SQLAlchemy queries)
├── models/               SQLAlchemy ORM models
└── schemas/              Pydantic request/response schemas
```

Request flow: `route → service → repository → SQLAlchemy model`. Routes stay
thin; business rules (recommendation scoring, matching, etc.) live in
`services/` so they're independently testable.

## Core commerce schema (Phase 2)

Canonical hierarchy: `Brand → Product → Variant → RetailerListing → PriceRecord`.

- **Brand**, **Category** (self-referential parent/child).
- **Product** — a canonical model (e.g. "MacBook Air M2"). Grouping into
  "product families" is deferred until a concrete need arises.
- **Variant** — a purchasable configuration (storage/RAM/color/...). Carries
  strong identity signals (`mpn`, `gtin`, `upc`, `ean`) for the Product
  Identity Engine (Phase 5) and a flexible `specs` JSON column for
  category-dependent structured specifications (avoids a rigid EAV schema).
- **Image** — attached to a Variant.
- **Retailer** — `is_mock` flags retailers currently backed by a mock/dev
  adapter (all of them, today) rather than a real integration.
- **RetailerListing** — one retailer's page/offer for a Variant.
  `(retailer_id, variant_id)` is intentionally not unique — a marketplace
  retailer can carry multiple sellers for the same variant (`seller_name`).
- **PriceRecord** — append-only price/availability observation per listing;
  this *is* the price-history table. "Current price" is the most recent
  record per listing, derived by query rather than duplicated, so there is
  a single source of truth. Carries provenance (`source`, `collected_at`,
  `confidence`) — UI freshness text ("Checked 8 minutes ago") is computed
  from `collected_at`, never stored as a claim.
- **ReviewSummary** — aggregate rating/review data per listing, with the
  same provenance fields. Aspect-level sentiment and cross-retailer
  consensus are future extensions (Phase 20).

Alembic migrations live in `apps/api/alembic/versions/`; `alembic/env.py`
reads `DATABASE_URL` from `app.core.config` rather than a hardcoded URL, and
imports `app.models` so autogenerate sees the full schema. Constraint/index
names use an explicit naming convention (`app/core/database.py`) for stable
diffs across SQLite and PostgreSQL.

Dev seed data: `apps/api/scripts/seed.py` — see `docs/data-sources.md`.

## Product identity engine (Phase 5)

`app/services/identity/`:

- `types.py` — `MatchSignals` (structured comparison input: strong
  identifiers `mpn/gtin/upc/ean`, plus `brand_slug`/`category_slug`/
  `product_name`/`specs`) and `MatchResult` (`match_type`, `confidence`,
  `reasons`). `MatchSignals.from_variant()` builds signals from an ORM
  `Variant`.
- `matcher.py` — `match(a, b) -> MatchResult`, fully deterministic (no
  ML/LLM). A shared strong identifier is decisive
  (`MatchType.EXACT_MATCH`, confidence 1.0). Otherwise: different/missing
  category → `NO_MATCH`; same brand+model+identical specs → `EXACT_MATCH`
  (confidence < 1.0, since it's inference rather than an identifier);
  same brand+model, differing specs → `VARIANT`; same brand, different
  model → `SIMILAR`; same category, different brand → `ALTERNATIVE`.
  Confidence scales with structured-spec overlap within each band.

This is a comparison engine, not a persisted table — nothing in the schema
auto-merges products. Persisting reviewable matches (e.g. for an admin
approval workflow) is a Phase 31+ concern.

## Recommendation engine (Phase 6)

`app/services/recommendation/` implements the pipeline from section 17 of
the product brief: hard constraints → candidate eligibility → soft
preferences → evidence → scoring → ranking. An LLM never picks a winner —
this is fully deterministic; a future AI layer (Phase 12) may narrate the
result, never override it.

- `types.py` — `HardConstraints` (non-negotiable filters: category, price
  range, min RAM/storage, allowed brands, in-stock requirement),
  `SoftPreferenceWeights` (price/performance/reviews/battery, normalized
  to sum to 1.0), `CandidateEvidence` (everything traceable to stored
  data), `ScoredCandidate` (sub-scores, total score, rank, labels,
  explanation), `RecommendationResult`.
- `evidence.py` — picks each variant's best (lowest, in-stock-if-required)
  current offer and applies hard constraints; a variant with no valid
  price is excluded, not scored with a guess.
- `scoring.py` — min-max normalizes each dimension across the candidate
  set, combines with preference weights, and generates rule-based
  explanation bullets. Performance/battery are heuristic proxies from
  structured specs (ram_gb/storage_gb, battery_wh/battery_mah) — when a
  spec is absent, the sub-score is neutral (0.5) and the explanation says
  so explicitly rather than implying evidence that doesn't exist.
- `engine.py` — `recommend(db, hard, preferences, limit)` orchestrates the
  pipeline and assigns "Best Overall" / "Best Budget Option" / "Best
  Value" labels.
- `app/repositories/recommendation_repository.py` — eager-loads candidate
  products for a category/brand set in one query.

## Web frontend (Phase 7)

`apps/web` — Next.js 16 (App Router, TypeScript strict, Tailwind CSS v4).

- `lib/api/` — typed client mirroring the backend's Pydantic schemas
  exactly (`types.ts`), a `fetch` wrapper mapping the backend's
  `{error:{code,message,request_id}}` shape into `ApiError`
  (`client.ts`), and typed query functions (`products.ts`). All reads use
  `cache: "no-store"` — price/availability freshness outweighs caching.
- `components/layout/` — `SiteHeader` (responsive nav, mobile menu),
  `SiteFooter`, `Container`.
- `components/product/ProductCard.tsx` — reusable catalog card. Renders a
  stylized placeholder tile rather than an `<img>` for now, since seed/mock
  data uses non-resolving placeholder image URLs (see `docs/data-sources.md`).
- `components/ui/DemoDataBadge.tsx` — visible "Demo data" marker, used
  wherever mock/dev retailer data is surfaced (trust principle #5/#12).
- Data-fetching pattern follows the framework's own guidance (Next.js
  ships version-specific docs in `node_modules/next/dist/docs/` — checked
  before writing this phase, since this Next.js version postdates this
  assistant's training): Server Components fetch directly and pages read
  the `searchParams` prop for filters/pagination, rather than client-side
  fetching — avoids an extra client/server round trip and keeps filtering
  bookmarkable/shareable via the URL.
- Palette: Tailwind's built-in indigo (brand/trust), emerald
  (value/positive), amber (freshness/caution only, never a discount
  badge), slate (neutral). Light theme only for MVP — dark mode deferred,
  see `docs/product-decisions.md`.

## Product search experience (Phase 8)

`/search` (`app/search/page.tsx`) — Server Component reading the
`searchParams` prop (text query, category, brand, price range, sort,
page), fetching products/categories/brands in parallel via
`Promise.allSettled` so one failing call doesn't take down the others.

- `components/search/SearchFilters.tsx` — client component; updates the
  URL via `router.push` on submit, so filters are bookmarkable/shareable
  and the page re-renders server-side on every change (no client-side
  data fetching).
- `components/search/Pagination.tsx` — plain server-rendered `<Link>`s
  that preserve the other query params.
- `app/search/loading.tsx` — skeleton fallback shown automatically by
  Next.js while the Server Component's data fetches are in flight.
- `components/ui/EmptyState.tsx` / `ErrorState.tsx` — shared loading/
  empty/error primitives, also used on the home page.

## Product page (Phase 9)

`/products/[slug]` (`app/products/[slug]/page.tsx`) fetches
`ProductDetail` server-side and hands it to
`components/product/ProductDetailView.tsx` (client component: variant
switcher with local state — no refetch, since every variant's offers are
already in the initial payload). `components/product/OffersTable.tsx`
renders the cross-retailer comparison: price, list-price discount %,
stock, rating, freshness, and a "Lowest price" badge, each clearly marked
`Demo` when `retailer_is_mock`.

**Centralized outbound links** (product brief §4): every retailer link
goes through `lib/retailerLink.ts` → `app/go/route.ts`, a Route Handler
that redirects to the target URL. No affiliate tagging or click tracking
is applied yet — this is purely the seam for adding it later (and later,
the `RetailerSelected` analytics event) without touching every call site.

**404 handling**: `notFound()` + `app/products/[slug]/not-found.tsx`
gives a real `HTTP 404` (verified against a production build, not just
`next dev`) — deliberately has **no** `loading.tsx` for this route,
because a `loading.tsx` here would wrap the page in an implicit
`<Suspense>` boundary that starts streaming a `200` before `notFound()`
can run, permanently locking in the wrong status (this is documented
Next.js behavior, not a bug — see
`node_modules/next/dist/docs/.../not-found.md`, "Calling notFound() after
streaming has started"). Correctness of the status code was judged more
important than a loading skeleton for what's normally a fast single-item
fetch.

## Configuration philosophy

Everything environment-specific (database URL, AI provider, currency/locale
defaults) is read from environment variables via `app/core/config.py`
(`Settings`). No environment- or country-specific behavior is hardcoded
inside business logic — `default_country`/`default_currency` are
configuration today (India/INR) precisely so more markets can be added by
adding configuration, not by branching code.

## Error handling

All API errors return `{"error": {"code", "message", "request_id"}}`. See
`app/core/errors.py`. Stack traces are logged server-side only, never
returned to clients.

## AI provider abstraction (Phase 11+)

A provider-agnostic interface will live under `app/services/ai/` so the app
can run with `AI_PROVIDER=none` (no external calls, AI UI explains
unavailability), or with OpenAI/Anthropic configured via `.env`. AI never
picks recommendation winners — see `docs/product-decisions.md`.

## Retailer adapter abstraction (Phase 3)

`app/services/retailers/`:

- `types.py` — `NormalizedOffer`, the one retailer-agnostic shape core app
  code depends on (price, availability, rating, specs, provenance). No code
  outside this package ever sees a retailer-specific field.
- `base.py` — `RetailerAdapter` ABC: `search`, `get_product`, `get_price`,
  `get_availability`, `get_offers`, `normalize`, `get_product_url`.
- `mock_base.py` — `MockRetailerAdapter`, shared logic for dev/mock
  adapters (in-memory fixtures, `is_mock=True`, `source="mock:<slug>_adapter"`).
- `adapters/` — one file per retailer (`amazon_in.py`, `flipkart.py`,
  `croma.py`, `myntra.py`, `meesho.py`, `nykaa.py`), each just a fixture
  list. Replacing one with a real integration (official API / licensed
  feed / approved partner source) touches only that file.
- `registry.py` — `get_adapter(slug)` / `list_adapters()`. Adding a
  retailer means one new adapter class + one registry entry.

No scraping, no anti-bot/CAPTCHA bypass, no ToS violations — see
`docs/data-sources.md`. Mock adapters are a separate, independent dataset
from the Phase 2 seed script (`scripts/seed.py`): the seed script represents
data already ingested into Budget Buddy's own catalog; adapters simulate
what a live retailer source would hand back before ingestion.

## Status

This document is updated as each phase lands. Current phase: see
`docs/product-decisions.md`.
