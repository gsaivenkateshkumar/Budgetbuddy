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

## Retailer adapter abstraction (Phase 3+)

Each retailer (Amazon India, Flipkart, Croma, Myntra, Meesho, Nykaa) is
represented by an adapter implementing a common interface (`search`,
`get_product`, `get_price`, `get_availability`, `get_offers`, `normalize`,
`get_product_url`). Until real integrations exist, adapters are clearly
labeled mock/dev implementations returning seed data — see
`docs/data-sources.md`.

## Status

This document is updated as each phase lands. Current phase: see
`docs/product-decisions.md`.
