# API

Interactive OpenAPI docs are always available at `/docs` (Swagger UI) and
`/redoc` when the backend is running — that is the source of truth for
request/response schemas as endpoints are added.

## Conventions

- All error responses: `{"error": {"code": string, "message": string, "request_id": string}}`.
- Every response carries an `X-Request-ID` header for tracing.
- Pagination/filtering conventions are documented here as list endpoints are
  added (Phase 4+).

## Endpoints (current)

| Method | Path                                          | Description                                    |
|--------|-----------------------------------------------|-------------------------------------------------|
| GET    | `/health`                                     | Liveness + DB connectivity check                |
| GET    | `/products`                                   | Search/list products (see query params below)   |
| GET    | `/products/{slug}`                            | Product detail: variants, images, retailer offers |
| GET    | `/products/{slug}/variants/{sku}/offers`      | Retailer offers for one variant (price comparison) |
| GET    | `/products/{slug}/variants/{sku}/price-history` | Price history + stats for one listing (`?retailer=` optional, defaults to cheapest in-stock) |
| GET    | `/brands`                                     | List all brands                                 |
| GET    | `/categories`                                 | List all categories                             |
| GET    | `/compare`                                    | Score/rank an explicit set of products (2+ `product` slugs, optional priority weights) |
| GET    | `/ai/status`                                  | Whether an AI provider is configured (`{configured, provider}`) |
| POST   | `/ai/chat`                                    | Ask Budget Buddy: one conversational turn (returns `503 ai_not_configured` if no provider is set up) |
| POST   | `/auth/register`                              | Create an account, returns a JWT                |
| POST   | `/auth/login`                                 | Authenticate, returns a JWT                     |
| GET    | `/auth/me`                                    | Current user (requires `Authorization: Bearer <token>`) |

### `GET /products` query params

`q` (text search), `category` (slug), `brand` (slug), `min_price`,
`max_price`, `sort` (`relevance` \| `price_asc` \| `price_desc`), `page`
(default 1), `page_size` (default 20, max 100). Returns a `Page` envelope:
`{items, total, page, page_size, total_pages}`.

Price filtering/sorting always uses each listing's most recent PriceRecord
(see `docs/architecture.md`) — never a cached price.

### Offer freshness

Every offer in a product detail response carries `collected_at`,
`freshness` (human text, e.g. "Checked 8 minutes ago"), `source`, and
`confidence`, plus `retailer_is_mock` — the frontend must surface this
provenance rather than presenting mock data as live.

This table grows phase-by-phase alongside `app/api/routes/`.
