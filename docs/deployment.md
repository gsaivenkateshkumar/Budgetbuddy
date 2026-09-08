# Deployment

## Target architecture

```
Browser → Next.js (managed hosting) → FastAPI (managed hosting) → managed PostgreSQL
```

Requirements: no Docker, HTTPS, GitHub-integrated deploys, environment
variables managed via each platform's secret store, India-viable latency,
free/low-cost starting tier. Specific providers are evaluated against
current pricing/capabilities at deployment time (Phase 16) rather than
assumed now.

## Production readiness (Phase 15)

What's already in place, ready for Phase 16 to point at real
infrastructure:

- **Database**: `DATABASE_URL` accepts SQLite (dev) or PostgreSQL
  (`postgresql+psycopg://...`, or a bare `postgres://`/`postgresql://`
  from a managed provider — normalized automatically in
  `app/core/config.py::Settings.sqlalchemy_url`). Business logic avoids
  SQLite-specific SQL throughout (portable `row_number()` window
  functions instead of `DISTINCT ON`, standard column types, `func.now()`
  for timestamps) — verified by code review; not yet exercised against a
  live Postgres instance locally (no Docker on this machine), so treat
  the first real deploy as the actual integration test for this.
- **Migrations**: run as a separate deploy step
  (`alembic upgrade head`), never automatically from application
  startup — avoids races between multiple app instances migrating
  concurrently.
- **Backend start command**: `uvicorn app.main:app --host 0.0.0.0 --port
  $PORT` (no `--reload` in production).
- **Frontend build**: `next build` with `output: "standalone"`
  (`apps/web/next.config.ts`) — a self-contained server bundle
  (`.next/standalone/server.js`) for containerless Node hosting; started
  with `node .next/standalone/server.js`.
- **CORS**: `FRONTEND_URL` accepts a comma-separated list, so a
  production domain and a preview/staging URL can both be allowed.
- **Secrets**: `app/main.py` refuses to start in production if
  `JWT_SECRET` is still the insecure dev default — verified locally by
  booting with `APP_ENV=production` both with and without a real secret.
- **Logging**: structured, single-line, written to stdout — compatible
  with any platform's log capture without extra configuration.
- **Errors**: every API error is `{"error": {"code", "message",
  "request_id"}}`; stack traces are logged server-side only, never
  returned to a client.

## Environment variables to set on the hosting platform

See `.env.example` for the full list and generation instructions
(`JWT_SECRET` especially — never reuse the local dev value). At minimum,
production needs: `APP_ENV=production`, `DATABASE_URL` (managed
Postgres), `JWT_SECRET` (freshly generated), `FRONTEND_URL` (the deployed
frontend's origin), and `NEXT_PUBLIC_API_URL` (the deployed backend's
origin, set on the frontend host) — plus `AI_PROVIDER`/API key only if AI
features are being enabled for that deployment.
