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

| Method | Path      | Description                          |
|--------|-----------|---------------------------------------|
| GET    | `/health` | Liveness + DB connectivity check      |

This table grows phase-by-phase alongside `app/api/routes/`.
