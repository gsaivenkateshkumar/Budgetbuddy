# Data Sources

## Current status: no live retailer integrations

No scraping, no unofficial API use, no CAPTCHA/anti-bot bypass, no ToS
violations. Until a retailer provides an official API, licensed feed, or
approved partner data source, that retailer is represented by a **mock/dev
adapter** returning clearly-labeled seed data (Phase 3).

Planned retailer adapters: Amazon India, Flipkart, Croma, Myntra, Meesho,
Nykaa — each behind the same adapter interface
(`search/get_product/get_price/get_availability/get_offers/normalize/get_product_url`),
so a real integration can replace a mock adapter independently of the rest
of the app.

## Labeling

Any UI surfacing mock/dev data must clearly indicate it is demo/sample data,
not live retailer data. This is a hard requirement, not a style preference —
see the trust principles in `docs/product-decisions.md`.

## Development seed dataset (Phase 2)

`apps/api/scripts/seed.py` populates a small, clearly-fictional catalog:
4 products (MacBook Air M2, Dell XPS 13, Galaxy S23, iPhone 15) across 8
variants, listed by 4 of the 6 launch retailers (Amazon India, Flipkart,
Croma, Meesho — Myntra/Nykaa are fashion/beauty and will get listings once
non-electronics categories are seeded), with 5-point price history per
listing and a review summary. Placeholder image URLs use the
`placeholder.budgetbuddy.dev` domain to make clear they are not real assets.
Run it after `alembic upgrade head`; it is idempotent (skips if data already
exists) and must never run against a production database.

## Provenance metadata

Every price/availability/offer record carries `source`, `collected_at`, and
a freshness/confidence indicator so the UI can show e.g. "Checked 8 minutes
ago" and never presents stale data as real-time (Phase 2+).
