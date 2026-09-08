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

## Provenance metadata

Every price/availability/offer record carries `source`, `collected_at`, and
a freshness/confidence indicator so the UI can show e.g. "Checked 8 minutes
ago" and never presents stale data as real-time (Phase 2+).
