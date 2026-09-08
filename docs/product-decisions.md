# Product Decisions & Phase Log

This log tracks key architectural/product decisions and current build phase,
so future work stays consistent with earlier reasoning.

## Current phase

**Phase 0 — Repository and environment** (in progress)

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
