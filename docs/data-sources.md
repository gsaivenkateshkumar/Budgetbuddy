# Data Sources

## Current status: one real integration built, not yet live (Amazon India)

No scraping, no unofficial API use, no CAPTCHA/anti-bot bypass, no ToS
violations. Until a retailer provides an official API, licensed feed, or
approved partner data source, that retailer is represented by a **mock/dev
adapter** returning clearly-labeled seed data (Phase 3). Amazon India now has
a real adapter built against Amazon's currently-supported API — see
[Amazon India (Creators API)](#amazon-india-creators-api) below for what's
implemented and what external approval is still required before it can be
used.

All six launch retailers — Amazon India, Flipkart, Croma, Myntra, Meesho,
Nykaa — have a mock/dev adapter (`apps/api/app/services/retailers/adapters/`)
behind the same interface
(`search/get_product/get_price/get_availability/get_offers/normalize/get_product_url`),
so a real integration can replace one adapter independently of the rest of
the app and of the other retailers. Every adapter is marked `is_mock=True`
and every `NormalizedOffer` it returns carries `source="mock:<slug>_adapter"`
— never presented as live data.

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

## Amazon India (Creators API)

Amazon deprecated the Product Advertising API (PA-API) 5.0 — deprecated
2026-04-30, retired 2026-05-15 — in favor of the **Amazon Creators API**,
which uses OAuth 2.0 client-credentials auth instead of PA-API 5's
SigV4-style request signing. `AmazonCreatorsAdapter`
(`apps/api/app/services/retailers/adapters/amazon_creators.py`) implements
Budget Buddy's `RetailerAdapter` interface against this API. It is a normal
Python class, importable and directly testable like any other adapter — it
is intentionally **not** registered in
`app/services/retailers/registry.py` yet, because that registry's
`"amazon-in"` slug is currently claimed by the mock adapter that
`tests/test_retailer_adapters.py` depends on. Promoting it (pointing the
registry's `"amazon-in"` entry at `AmazonCreatorsAdapter` instead) is a
one-line follow-up once real credentials are validated end-to-end — see the
registry module's own docstring for the exact mechanism.

### What's implemented

- OAuth 2.0 client-credentials token exchange (HTTP Basic auth with the
  credential ID/secret, cached and refreshed automatically)
- `search()` — `POST /catalog/v1/searchItems`, capped at 10 items per call
  (Amazon's documented per-call limit; pagination beyond that is not
  implemented, out of scope for this change)
- `get_product()` / `get_offers()` — `POST /catalog/v1/getItems` by ASIN
- Mapping of Amazon's item JSON into Budget Buddy's `NormalizedOffer`
  (title, brand, price, list price, image, availability, seller, product
  URL)
- Bounded retry with backoff on HTTP 429 (rate limit), a distinct
  `AmazonAPIError` for other failures (status + body, never the token or
  credentials), and a distinct `AmazonCredentialsMissingError` raised only
  when a network call is attempted without credentials configured — the
  adapter itself always constructs successfully with no credentials, and
  the application never requires Amazon to start
- `apps/api/app/services/ingestion/catalog_ingestion.py` — a
  retailer-agnostic ingestion service (no Amazon-specific code) that takes
  any adapter's `NormalizedOffer` list and idempotently upserts it into the
  canonical `Brand -> Product -> Variant -> RetailerListing -> PriceRecord`
  schema, using the existing `RetailerListing.retailer_sku` field as the
  idempotency key and the Phase 5 identity engine to decide whether an
  offer attaches to an existing `Variant` (only on `EXACT_MATCH`) or
  creates a new one
- `apps/api/scripts/ingest_amazon.py` — CLI entrypoint:
  `python scripts/ingest_amazon.py --query "laptop" --limit 20 --category laptops`
- Full test coverage with mocked HTTP responses (`respx`) — no real network
  calls: `tests/test_amazon_creators_adapter.py` and
  `tests/test_catalog_ingestion.py`

### What's inferred, not independently verified

Amazon's Creators API reference documentation is gated behind an approved
Associates login and was not reachable during implementation. The request/
response shapes above (endpoint paths, `resources[]` request format, item
JSON field paths like `itemInfo.title.displayValue`) are built on
well-documented PA-API 5 conventions that the Creators API is publicly
documented to largely preserve outside the auth layer, plus public
migration write-ups. Treat these as a strong starting point, not a
guarantee — **verify against a real response once credentials are
approved**, and adjust `normalize()` and the request bodies in
`amazon_creators.py` if Amazon's actual response shape differs.

The token endpoint region routing is similarly inferred: India is
documented as grouped under the EU credential region for the Creators API.
`AMAZON_CREATORS_TOKEN_URL` and `AMAZON_CREATORS_API_BASE_URL` are
configurable (see `apps/api/app/core/config.py`) specifically so this can
be corrected per-account without a code change if it turns out to differ.

### External setup still required before live ingestion

This is a business/account requirement, not a code gap:

1. An Amazon Associates account in **final-accepted** status (not pending)
2. At least **10 qualifying referred sales in the trailing 30 days** —
   Amazon's documented eligibility bar for Creators API access
3. Once approved: set `AMAZON_CREATORS_CREDENTIAL_ID`,
   `AMAZON_CREATORS_CREDENTIAL_SECRET`, and `AMAZON_PARTNER_TAG` (see
   `.env.example`) — locally in `apps/api/.env`, in production via Render's
   environment variable settings (never committed)
4. Run `python scripts/ingest_amazon.py --query "<search term>" --category <slug>`
   once against a real account to verify the inferred field mappings above,
   then adjust `normalize()` if needed
5. Only after that: consider promoting `AmazonCreatorsAdapter` into the
   registry's `"amazon-in"` slug (see note above) and updating/removing the
   mock-adapter tests that currently assume that slug is a mock

### Rate limits and freshness

Amazon's documented starting rate limit is 1 request/second per credential.
The adapter retries once on HTTP 429 with a short backoff and then raises
`AmazonAPIError` rather than looping indefinitely — repeated ingestion runs
should be spaced out accordingly (e.g. a scheduled job, not a tight loop).
Every ingested offer carries `source="amazon_creators_api"` and a fresh
`collected_at` timestamp; the UI's existing freshness/provenance handling
(see above) applies unchanged.
