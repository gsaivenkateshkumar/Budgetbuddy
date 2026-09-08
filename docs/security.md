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

Email/password registration and login (`POST /auth/register`,
`POST /auth/login`), JWT bearer sessions (`python-jose`), and a protected
`GET /auth/me`. Guest browsing works for every core feature (search,
product pages, compare, Ask Budget Buddy) — nothing requires an account
yet; only future persistent features (price tracking, history,
personalization sync) will.

- **Passwords**: hashed with `bcrypt` directly (`app/core/security.py`)
  — not `passlib`, which is unmaintained (last release 2020) and broke
  against current `bcrypt` releases (`passlib` expected a `bcrypt.__about__`
  attribute removed in `bcrypt` 4.1+). Truncated to bcrypt's 72-byte input
  limit before hashing; salted per-hash by `bcrypt.gensalt()`.
- **Tokens**: JWT signed with `JWT_SECRET`/`JWT_ALGORITHM` from settings,
  `sub` = user id, expiring after `JWT_ACCESS_TOKEN_EXPIRE_MINUTES`.
  `app/main.py` refuses to start in production if `JWT_SECRET` is still
  the insecure dev default.
- **Login error messages are deliberately generic** ("incorrect email or
  password") for both "no such user" and "wrong password," so responses
  can't be used to enumerate registered emails.
- **Logout** is client-side token discard — tokens are stateless JWTs, and
  a server-side revocation list is out of scope for MVP (would need a
  shared store, i.e. Redis, which is explicitly deferred until scale
  requires it).
- **OAuth-ready**: `User.hashed_password` and the register/login flow are
  isolated behind `auth_service.py`; adding an OAuth provider later means
  adding a new login path that also issues a JWT via
  `create_access_token`, not restructuring existing users/sessions.
- Extensively security-tested (`tests/test_auth_security.py`): tampered/
  wrong-secret/expired/garbage JWTs are all rejected, hashes are salted
  differently per call, and no response ever echoes a password or hash.

## Production readiness review (Phase 15)

- Grepped the backend for stray `print()`/hardcoded secrets before this
  phase's commit — none found; all logging goes through the structured
  logger, and the only "secret-looking" strings in the tree are test
  fixture placeholders (`test-key`, `sk-test`) in `tests/`.
- Confirmed no `.env`/`.env.local` file has ever been committed
  (`git ls-files | grep '\.env'` returns only `.env.example`).
- `app/main.py` now hard-fails at import time if `APP_ENV=production` and
  `JWT_SECRET` is still the insecure dev default — verified locally both
  ways (refuses to boot with the default; boots and serves `/health`
  with a real generated secret).
- **Rate limiting is architected for but not implemented**: no request
  throttling exists yet. Deferred deliberately — meaningful rate limiting
  needs a shared store (Redis) across instances, which is out of scope
  until scale requires it (per the product brief). A reverse proxy /
  platform-level rate limit at the Phase 16 hosting provider is the
  interim mitigation.

## Dependency hygiene

Backend dependencies are pinned in `requirements.txt` /
`requirements-dev.txt`. Review and update periodically; do not add
dependencies casually.

## Reporting

This is an internal development project; no external vulnerability
disclosure process is set up yet.
