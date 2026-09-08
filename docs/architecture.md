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

## Comparison (Phase 10)

Backend: `GET /compare?product=slug&product=slug&price=W&performance=W&reviews=W&battery=W`
(`apps/api/app/api/routes/compare.py`) reuses the Phase 6 recommendation
engine rather than duplicating scoring logic — `engine.py` was refactored
to extract `_score_rank_and_label()`, shared by `recommend()` (searches a
category under hard constraints) and the new `compare()` (scores an
explicit, user-picked set of product slugs; each product contributes its
single cheapest eligible variant, so comparison operates at product
granularity — "compare iPhone and Galaxy," not specific SKUs). An unknown
slug is silently excluded (`excluded_count`), not an error, since the UI
lets users freely add/remove products.

Frontend: `/compare` (`app/compare/page.tsx`) has two modes — fewer than 2
`product` query params shows `ProductPicker` (checkbox list from the
catalog); 2+ calls `/compare` and renders `ComparisonTable`. The table
computes which spec keys actually *differ* across the selected products
client-side (well, server-side, since it's a Server Component) and
surfaces those under "Key differences" first, with identical specs
collapsed under "Also shared" — deliberately not a giant uniform spec
dump, per the product brief. `PriorityControls` (client component, range
sliders + presets) pushes new `price`/`performance`/`reviews`/`battery`
query params, causing the Server Component to refetch `/compare` with
different weights — this is the "make price more important" /
"prioritize battery" interaction, via explicit controls rather than
freeform text (natural-language priority adjustment is Ask Budget
Buddy's job, Phase 12).

## AI provider abstraction (Phase 11)

`app/services/ai/`:

- `types.py` — `ChatMessage`, `ToolSpec`, `ToolCall`, `ChatCompletion`,
  and two distinct exceptions: `AIProviderNotConfiguredError` (no
  provider set up — expected, handled gracefully) vs `AIProviderError`
  (a configured provider failed — a real error).
- `base.py` — `AIProvider` ABC: one method, `complete(messages, tools)`.
- `providers/none_provider.py` — active whenever `AI_PROVIDER=none` (the
  default) or a key is missing. Makes no network calls; raises
  `AIProviderNotConfiguredError` rather than fabricating a response.
- `providers/openai_provider.py` / `anthropic_provider.py` / `groq_provider.py`
  — real HTTP clients (`httpx`) translating the common
  `ChatMessage`/`ToolSpec` shape into each vendor's actual request format
  (OpenAI Chat Completions; Anthropic Messages API, including its
  distinct system-prompt and tool-result conventions; Groq via its
  OpenAI-compatible endpoint) and back. Never imported/instantiated
  unless the matching key is present. OpenAI and Groq share request/
  response translation via `providers/_openai_compatible.py` (a private
  helper module, not a provider) since Groq's wire format is
  byte-identical to OpenAI's — each still owns its own endpoint, API key,
  default model, and error message, so this stays genuine provider
  separation rather than a branch inside `OpenAIProvider`.
- `factory.py` — `get_ai_provider()` is the *only* place `AI_PROVIDER`/API
  keys are read; everything else depends on the `AIProvider` interface.
- `tools.py` — tool schemas wired to real services already built
  (`search_products`, `get_product_details`, `compare_products`,
  `get_prices`, backed by `product_service` and the recommendation
  engine's `compare()`). `dispatch_tool()` executes one call and returns
  JSON-serializable data — no stub tools kept just to satisfy the
  interface (per product brief §18).

`GET /ai/status` (`app/api/routes/ai.py`) reports `{configured, provider}`
so the frontend can show AI features as unavailable instead of broken —
core search/product/compare features are entirely unaffected by whether
AI is configured. The actual conversational loop (using these tools) is
Phase 12; this phase is the foundation only. AI keys are read only by the
backend — the frontend never receives them.

## Ask Budget Buddy (Phase 12)

`app/services/ai/agent.py` — `run_agent_turn(db, provider, history,
user_message)`: a bounded (`MAX_TOOL_ROUNDS = 4`) tool-calling loop, fully
server-side per request. On each round it calls
`provider.complete(messages, tools=ALL_TOOLS)`; if the model asks for
tool calls, each is executed via `dispatch_tool()` against real data and
the result is appended as a `TOOL` message, then the loop continues. If
the model instead returns plain text, that's the final reply. A tool
failure becomes a `{"error": ...}` message the model sees (so it can
explain the limitation to the user), never a crash. Hitting the round
limit returns an honest "couldn't finish in time" message rather than
looping forever or fabricating an answer. A `search_products` call that
comes back with `total: 0` is tracked separately: after
`MAX_EMPTY_CATALOG_SEARCHES` (2) empty searches in one turn, the loop
stops early with an explicit "no matching products in the catalog"
reply instead of grinding through the remaining rounds and surfacing the
generic, catalog-blind timeout message.

**Conversation memory — same-session only, client-held.** There is no
server-side conversation/session store: no `Conversation` model, no DB
table, no session ID. `components/ask/AskChat.tsx` holds the entire
transcript in React `useState`; on every send it replays the full
transcript back to the backend as `ChatRequest.history` (role + content
only — tool calls/results from *earlier* turns are not round-tripped,
only the current turn's own tool loop keeps those), and
`run_agent_turn` prepends that history before the new message on every
request — the backend itself is stateless per request. Consequences,
verified by tracing (not assumed): a page refresh, closing the tab, or
navigating away from `/ask` discards the conversation immediately (nothing
to restore — there is no persistence layer to restore it from); logging
out/in has no effect either way, since the chat was never tied to the
account. This satisfies "reliable multi-turn conversational context within
one session" (the actual requirement) without the structured long-term
shopping-session state (intent/budget/brand memory beyond one page load)
described as future scope in the product brief.

`ChatMessage.tool_calls` (added this phase) lets an assistant's tool-call
request round-trip back through *either* provider's own wire format on
the next request — OpenAI's `tool_calls` array vs. Anthropic's
`tool_use` content blocks — so the agent loop itself stays
provider-agnostic.

The system prompt (`agent.py::SYSTEM_PROMPT`) encodes the product brief's
AI rules directly: only state facts that came from a tool result in this
conversation, use tools rather than guess, ask one focused clarifying
question when something critical is missing, explain rankings with
tool-sourced evidence, and say "not sure" rather than invent.

`POST /ai/chat` (`app/api/routes/ai.py`) returns `503
{error: {code: "ai_not_configured"}}` when no provider is configured —
the frontend (`/ask`, `app/ask/page.tsx`) checks `GET /ai/status` first
and shows an explanatory notice instead of a chat box in that case. Core
search/product/compare pages are entirely unaffected either way.
`components/ask/AskChat.tsx` shows which tools were used per reply (a
small transparency badge, e.g. "Searched the catalog") — visible evidence
the answer came from real data, not a guess.

## Price intelligence (Phase 13)

`GET /products/{slug}/variants/{sku}/price-history?retailer=<slug>`
(`app/services/price_service.py`) computes `PriceStats` — current/lowest/
highest/average price, point count, `tracking_since`, `is_lowest_recorded`,
and list-price discount % — purely from that listing's stored
`PriceRecord` rows (`price_repository.get_price_history_for_listing`).
Omitting `retailer` defaults to the variant's current cheapest in-stock
listing. Every number is traceable to a stored row; nothing is
extrapolated or inferred.

**"Lowest ever" guardrail**: the response and UI copy both say "lowest
*recorded*"/"lowest we've tracked," scoped to `tracking_since` — never an
unscoped "lowest ever" claim, since our stored history only covers what
we've actually observed (see product brief trust principle #4).
`components/product/PriceHistoryPanel.tsx` renders a lightweight inline
SVG sparkline (no charting library) and states this scope explicitly in
its footer text.

## Account foundation (Phase 14)

Backend: `app/core/security.py` (bcrypt hashing, JWT issue/decode) +
`app/services/auth_service.py` (register/login business logic) +
`app/api/deps.py::get_current_user` (Bearer-token dependency for
protected routes) + `POST /auth/register`, `POST /auth/login`,
`GET /auth/me`. `app/main.py` refuses to start in production with the
insecure default `JWT_SECRET`. See `docs/security.md` for the full
threat-model notes (generic login errors, stateless-JWT logout tradeoff,
OAuth extension point).

Frontend: `components/auth/AuthProvider.tsx` — a context restoring the
session from a stored JWT on mount (via `GET /auth/me`), exposing
`user`/`loading`/`signIn`/`signOut` to the whole app (wrapped around
`children` in the root layout, so `SiteHeader`'s "You" nav item reflects
auth state). `lib/auth/session.ts` stores the token in `localStorage` —
documented there as an explicit MVP tradeoff (simpler than httpOnly
cookies for a separately-hosted frontend/backend, at the cost of
XSS-readability). `/login`, `/register`, `/account` are plain client
components with no server-side dependency on user state — nothing in the
app *requires* an account; search/product/compare/Ask Budget Buddy all
work as a guest.

**A note on effect-based data fetching**: this phase's two components
(`AuthProvider`, and Phase 13's `PriceHistoryPanel`) both hit the same
`eslint-plugin-react-hooks` "no synchronous setState in an effect" rule
(new in React 19's stricter hooks linting). The fix in both cases: do the
state update inside a `.then()`/`.catch()`/async-IIFE callback with a
`cancelled` guard, never as a direct top-level statement in the effect
body — even for the "nothing to do" branch. `AuthProvider` additionally
keeps `loading` initialized to `true` unconditionally (rather than a
lazy `useState(() => hasToken())`) specifically to avoid an SSR/hydration
mismatch, since `localStorage` doesn't exist during server rendering.

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
