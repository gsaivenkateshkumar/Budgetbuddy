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
