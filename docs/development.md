# Development Guide

## Backend (`apps/api`)

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
cp ../../.env.example .env      # edit as needed; local defaults work out of the box
alembic upgrade head
python scripts/seed.py           # populates a small dev/demo product catalog
uvicorn app.main:app --reload
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Tests

```bash
cd apps/api
pytest -q
```

Tests run against an isolated in-memory SQLite database (see
`tests/conftest.py`) — they never touch your local `budget_buddy.db`.

### Lint / type-check

```bash
cd apps/api
ruff check app tests
mypy app
```

## Frontend (`apps/web`)

```bash
cd apps/web
npm install
npm run dev
```

- Web app: http://localhost:3000

(Frontend scaffold lands in Phase 7.)

## Environment variables

See `.env.example` at the repo root for the full list. Copy it to
`apps/api/.env` for the backend. Never commit a real `.env` file — it's
git-ignored.

## Database

- Development: SQLite file `apps/api/budget_buddy.db` (git-ignored, created
  automatically by `alembic upgrade head`).
- Production: PostgreSQL, same SQLAlchemy models, via `DATABASE_URL`.
- Schema changes always go through Alembic migrations
  (`alembic revision --autogenerate -m "..."`, then `alembic upgrade head`).
- `python scripts/seed.py` populates a small, clearly-fictional development
  catalog (4 products / 8 variants / 18 retailer listings with price
  history) — see `docs/data-sources.md`. It's idempotent: it skips seeding
  if data already exists.
