# Product Decisions & Phase Log

This log tracks key architectural/product decisions and current build phase,
so future work stays consistent with earlier reasoning.

## Current phase

**Phase 16 — Deployment** (prep complete; blocked on user actions — see
below). Next: Phase 17 — publish-ready verification, once deployed.

### Phase log

- Phase 16 — Deployment: researched current (2026) hosting pricing/
  capabilities via web search rather than relying on possibly-stale
  training data (see `docs/deployment.md`). Chose, with user
  confirmation: **Vercel** (frontend — free Hobby tier, native Next.js
  support), **Render** (backend — free web-service tier, native Python,
  no Dockerfile), **Neon** (Postgres — permanent free tier, unlike
  Render's own free Postgres which expires after 30 days). Rejected
  Railway (usage-based, no flat free tier) and Fly.io (free tier
  discontinued Oct 2024). Added `render.yaml` (Blueprint spec, validated)
  and a full step-by-step deployment guide. **Blocked on external
  actions the user must perform themselves**: creating the GitHub repo
  and giving me the URL to push to; signing up for Neon/Render/Vercel
  (account creation is explicitly not something to automate) and running
  through each dashboard's connect-repo flow. Everything not depending on
  those accounts is done.

- Phase 15 — Production preparation: done. `DATABASE_URL` now accepts a
  bare `postgres://`/`postgresql://` (auto-normalized to
  `postgresql+psycopg://`) alongside SQLite; `psycopg[binary]` added as a
  runtime dependency. `FRONTEND_URL`/CORS now accepts a comma-separated
  list. Frontend build set to `output: "standalone"` for containerless
  Node hosting. Documented (in `docs/deployment.md`): migrations run as a
  separate `alembic upgrade head` step, never from app startup; the
  production start commands for both apps; required environment
  variables per host. Security review pass: no stray secrets/print
  statements, no `.env` ever committed, production-boot JWT-secret guard
  verified both ways locally. Backend suite grows to 125 tests. Postgres
  compatibility is verified by code review only (portable SQL throughout,
  no SQLite-specific constructs) — not yet exercised against a live
  Postgres instance, since Docker is off the table on this machine; the
  first real deploy in Phase 16 is the actual integration test for that.

- Phase 14 — Account foundation: done. Email/password auth
  (`POST /auth/register`, `POST /auth/login`, `GET /auth/me`) with
  bcrypt password hashing and JWT bearer sessions. Swapped `passlib` for
  direct `bcrypt` mid-phase — `passlib` (unmaintained since 2020) crashes
  against `bcrypt` 4.1+, a real current-day incompatibility, not a
  hypothetical one. Login failure messages are deliberately generic to
  resist email enumeration; production startup refuses an insecure
  default `JWT_SECRET`. Frontend: `/login`, `/register`, `/account` pages
  and an `AuthProvider` context restoring sessions from a stored JWT;
  `localStorage` token storage is a documented MVP tradeoff (see
  `docs/security.md`). Nothing in the app requires an account — guest
  browsing still covers every core feature. Backend suite grows to 119
  tests, including a dedicated `test_auth_security.py` (tampered/wrong-
  secret/expired/garbage JWTs, hash salting, no password ever echoed in
  a response) per this phase's acceptance criterion. Frontend verified
  via production build (`/login`/`/register`/`/account` all prerender
  static) and a live end-to-end register → login → `/auth/me` check
  against the real running backend.

- Phase 13 — Price intelligence: done. `GET /products/{slug}/variants/
  {sku}/price-history` computes current/lowest/highest/average price,
  point count, tracking-since date, and list-price discount % purely
  from stored `PriceRecord` rows for one listing — nothing extrapolated.
  Explicitly worded "lowest *recorded*"/"since &lt;date&gt;," never an
  unscoped "lowest ever" claim, in both the API and the frontend's inline
  SVG sparkline panel. Backend suite grows to 99 tests. Frontend hit two
  React 19 purity-rule lint catches (setState-in-effect, `Date.now()`
  during render) — fixed by keying the panel by variant SKU (remount
  gives a clean loading state) and computing the "tracked for N days"
  figure inside the fetch callback instead of at render time. Verified
  via production build and a live check of the endpoint against real
  seeded multi-point price history.

- Phase 12 — Ask Budget Buddy: done. Bounded tool-calling agent loop
  (`apps/api/app/services/ai/agent.py`, max 4 rounds) executes the Phase
  11 tools against real data and returns a plain-text reply; a tool
  failure becomes a model-visible error message rather than a crash, and
  hitting the round limit returns an honest "couldn't finish" message.
  `ChatMessage` extended with `tool_calls` so an assistant's tool request
  round-trips through either provider's own wire format on the next
  turn — kept the loop itself provider-agnostic. System prompt encodes
  the brief's uncertainty/evidence rules directly. `POST /ai/chat`
  returns 503 when unconfigured; `/ask` frontend checks status first and
  shows an explanatory notice instead of a broken chat box in that case,
  with tool-use transparency badges when it does answer. Backend suite
  grows to 94 tests (agent loop tested with a scripted fake provider —
  no real network — covering plain replies, tool execution, the round
  limit, and tool-error recovery). Frontend verified via production
  build and a live check of the unconfigured state (no crash, correct
  notice).

- Phase 11 — AI foundation: done. Provider-agnostic `AIProvider`
  interface (`apps/api/app/services/ai/`) with real OpenAI and Anthropic
  HTTP implementations plus a `NoneProvider` that's active by default and
  raises a clear "not configured" error instead of fabricating output.
  `get_ai_provider()` is the sole place `AI_PROVIDER`/keys are read. Tool
  schemas (`search_products`, `get_product_details`, `compare_products`,
  `get_prices`) are wired to real service functions already built in
  Phases 4/6/10 — no stub tools. `GET /ai/status` lets the frontend know
  whether AI is usable. Backend suite grows to 86 tests (provider request/
  response translation mocked with `respx`; factory fallback behavior;
  tool dispatch against real seeded data). Core app is unaffected either
  way — confirmed `/ai/status` returns `configured: false` with no
  `AI_PROVIDER` set, no crash anywhere.

- Phase 10 — Comparison: done. `GET /compare` reuses the Phase 6
  recommendation engine (refactored to share scoring/ranking/labeling
  between `recommend()` and the new `compare()`) to score an explicit set
  of product slugs. `/compare` frontend page: a picker when fewer than 2
  products are selected, otherwise a comparison table that highlights
  differing specs first and collapses identical ones, plus priority
  sliders (price/performance/reviews/battery) that recompute the ranking
  via URL query params. Backend suite grows to 69 tests; frontend
  verified via production build and direct HTTP checks against the
  running dev server showing real seeded data, correct labels, and
  correct "key differences" output.

- Phase 9 — Product page: done. `/products/[slug]` with variant switching
  (client-side, no refetch — all variants' offers arrive in one payload),
  a cross-retailer offers table (price, list-price discount %, stock,
  rating, freshness, demo-data labeling), and real `HTTP 404` handling
  for unknown slugs. Added a centralized outbound-link redirector
  (`app/go/route.ts` + `lib/retailerLink.ts`) per the product brief's
  monetization architecture requirement — no tracking applied yet, just
  the seam for it. Verified via production build + `next start`,
  confirming both the 200/404 status codes and real seeded data with
  curl. Learned mid-phase: a route's `loading.tsx` forces streaming to
  start as 200 before an in-page `notFound()` can run, permanently
  locking in the wrong status — removed `loading.tsx` from this route
  for that reason (see architecture.md for the full explanation).

- Phase 8 — Product search experience: done. `/search` page with text
  search, category/brand/price filters, sort, pagination — filters update
  the URL (bookmarkable/shareable) via a client component, while data
  fetching stays entirely server-side. Loading skeleton via
  `loading.tsx`, shared `EmptyState`/`ErrorState` components (home page
  refactored to use them too). Verified via production build, lint,
  `tsc --noEmit`, and a direct HTTP fetch of the rendered route
  confirming real seeded data reaches the response. Note: the in-session
  browser-automation tool intermittently showed a stuck loading skeleton
  when its pane was hidden (a rendering/timer-throttling quirk of the
  automation harness, not the app — confirmed by curl showing the
  correct final HTML).

- Phase 7 — Web foundation: done. Next.js 16 app (App Router, TypeScript
  strict, Tailwind CSS v4) in `apps/web`: responsive header/footer shell
  with mobile nav, home page (hero search + AI entry point + example
  prompts + value props + live "Explore the catalog" section fetched from
  the backend), typed API client, reusable `ProductCard`. Verified with a
  production build, lint, `tsc --noEmit`, and a live dev-server check
  against the running backend (desktop + mobile viewport) — no console
  errors, correct data. Decision: light theme only for MVP, dark mode
  deferred; product images are placeholder tiles for now since seed data
  uses non-resolving mock URLs.

- Phase 6 — Recommendation engine: done. Deterministic pipeline (hard
  constraints → eligibility → soft preferences → evidence → scoring →
  ranking) in `apps/api/app/services/recommendation/`. No LLM involved.
  Performance/battery scores are heuristic proxies from structured specs;
  missing specs yield a neutral score and an explicit "no evidence"
  explanation rather than a fabricated claim. Labels: Best Overall / Best
  Budget Option / Best Value. Pytest suite grows to 65 tests, covering
  budget/RAM constraints, out-of-stock exclusion, preference reweighting,
  and the no-evidence explanation guarantee.

- Phase 5 — Product identity engine: done. Deterministic
  `MatchSignals`/`MatchResult`/`match()` in
  `apps/api/app/services/identity/` distinguishing EXACT_MATCH, VARIANT,
  SIMILAR, ALTERNATIVE, NO_MATCH from structured attributes only (strong
  identifiers first, then brand/category/name/spec-overlap) — no ML/LLM
  involved in identity decisions. Pytest suite grows to 55 tests covering
  each relationship type plus confidence bounds.

- Phase 4 — Product APIs: done. `GET /products` (search/filter/sort/
  paginate), `GET /products/{slug}` (detail with variants + cross-retailer
  offers), `GET /products/{slug}/variants/{sku}/offers`, `GET /brands`,
  `GET /categories`. Price filter/sort and "current price" both derive from
  the latest PriceRecord per listing via a portable (SQLite + Postgres)
  `row_number()` window-function subquery — no cached price column.
  Every offer exposes `collected_at`/`freshness`/`source`/`confidence`/
  `retailer_is_mock`. Pytest suite grows to 43 tests; smoke-tested live
  against the real seeded SQLite DB.

- Phase 3 — Retailer adapter abstraction: done. `RetailerAdapter` interface
  and `NormalizedOffer` common type (`apps/api/app/services/retailers/`);
  mock/dev adapters for all 6 launch retailers, each an independent file
  with its own small fixture dataset; registry for lookup by slug. Pytest
  suite extended to 31 tests (parametrized across all 6 adapters). Decision:
  adapter mock fixtures are intentionally separate from the Phase 2 seed
  script — they model different layers (external source vs. ingested
  catalog).

- Phase 0 — Repository and environment: done.
- Phase 1 — Backend foundation: done. FastAPI app (`apps/api`), config via
  `pydantic-settings`, SQLAlchemy engine (SQLite dev), Alembic wired to
  `DATABASE_URL`, structured logging, request-id middleware, structured
  error schema, `/health` endpoint, pytest suite (3 tests passing), ruff
  clean.
- Phase 2 — Core commerce schema: done. SQLAlchemy models (Brand, Category,
  Product, Variant, Image, Retailer, RetailerListing, PriceRecord,
  ReviewSummary) with provenance/freshness fields, initial Alembic
  migration, dev seed script (4 products / 8 variants / 18 listings with
  price history), pytest suite extended to 6 tests. Decision: `specs` is a
  JSON column on Variant (not EAV) to avoid a migration per product
  category; "current price" is always derived from the latest `PriceRecord`
  rather than duplicated onto RetailerListing.

## Decisions log

- **Monorepo layout**: `apps/web` (Next.js) + `apps/api` (FastAPI) +
  `packages/shared`. Keeps frontend/backend cleanly separated while allowing
  shared TypeScript types later.
- **Dev DB: SQLite, Prod DB: PostgreSQL**, both via SQLAlchemy + Alembic.
  Business logic must avoid SQLite-specific assumptions.
- **No Docker/Kubernetes/local Redis** for local dev — laptop is
  resource-constrained. Redis may be introduced later only if scale requires
  it.
- **Retailers are mock/dev adapters until real integrations exist.** No
  scraping, no bypassing anti-bot/CAPTCHA/ToS. Adapter interface is
  retailer-agnostic so real APIs/feeds can be swapped in later.
- **No affiliate monetization in V1.** Outbound retailer links go through a
  centralized redirect service so tracking can be added later without
  touching ranking logic. Rankings never depend on commission.
- **AI provider-agnostic.** App must run with `AI_PROVIDER=none` (no key) —
  core search/comparison keep working, AI-specific UI explains
  unavailability. No fabricated AI output.
- **Recommendation engine is deterministic**, not LLM-chosen. LLM explains
  results computed by structured scoring; it does not pick winners.
- **i18n-ready from the start**: currency, locale, tax, and retailer sets
  are configuration, not hardcoded business logic — even though V1 only
  ships India/INR/English.

## Out of scope for MVP (see build prompt §54)

Native mobile apps, full multilingual UI, complete business planner, advanced
basket optimizer, WhatsApp integration, enterprise analytics, microservices,
Kubernetes, Elasticsearch/Redis (unless required), dozens of retailers,
complex payments, affiliate monetization.
