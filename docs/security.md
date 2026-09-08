# Security

## Secrets

- All secrets (DB credentials, JWT secret, AI provider keys) come from
  environment variables — never hardcoded, never committed. `.env` files are
  git-ignored; `.env.example` holds placeholder names only.
- Frontend secrets that must stay server-side never use the `NEXT_PUBLIC_`
  prefix (which Next.js inlines into client bundles).
- AI provider keys are read only by the backend; the frontend never sees
  them.

## Logging

`app/core/logging.py` never logs request/response bodies wholesale and
application code must never log passwords, API keys, tokens, or other
secret environment variables. Log structured key=value lines with a
`request_id` for traceability (`app/core/middleware.py`).

## Error responses

Clients only ever receive `{"error": {"code", "message", "request_id"}}` —
see `app/core/errors.py`. Stack traces and internal exception details are
logged server-side, never returned to the client.

## CORS

`CORSMiddleware` is scoped to `FRONTEND_URL` from settings, not `*` —
configurable per environment.

## Auth (Phase 14)

Planned: email/password with hashed passwords (`passlib[bcrypt]`) and
JWT-based sessions (`python-jose`), with the auth layer designed so OAuth
providers can be added later without a rewrite. Guest browsing is supported
for search/comparison; only persistent features (price tracking, history,
personalization sync) require an account.

## Dependency hygiene

Backend dependencies are pinned in `requirements.txt` /
`requirements-dev.txt`. Review and update periodically; do not add
dependencies casually.

## Reporting

This is an internal development project; no external vulnerability
disclosure process is set up yet.
