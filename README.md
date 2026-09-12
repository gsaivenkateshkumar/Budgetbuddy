# Start Currency

> Turn your idea into a business.

Start Currency is an AI business builder and operating assistant, operated
by Promote. It helps people validate a business idea, plan a launch, budget
startup costs, run break-even/margin/pricing calculations, track a launch
roadmap, and manage real revenue and expenses — with an AI copilot that has
context on the user's own business.

Launch market: **India** (INR, English). The architecture is
internationalization-ready for future markets/currencies/languages.

Note: this repository was originally built as "Budget Buddy", a shopping-
comparison product, before pivoting to Start Currency. Some historical
Alembic migrations and unused database tables from that product remain for
migration-history safety — see `docs/product-decisions.md`.

## Repository structure

```
BudgetBuddy/
├── apps/
│   ├── web/          Next.js (React, TypeScript, App Router) frontend
│   └── api/           FastAPI (Python) backend
├── packages/
│   └── shared/         Shared types/constants used by web (and future clients)
├── docs/                Architecture, API, deployment, security docs
├── scripts/             Dev/setup scripts
├── .env.example         Environment variable template (copy, never commit real values)
└── README.md
```

## Prerequisites

- Node.js 24+ and npm 11+
- Python 3.12+
- Git
- **No Docker required.**

## Local setup

### 1. Clone and configure environment

```bash
cp .env.example apps/api/.env
```

Edit `apps/api/.env` and fill in any values you have (all AI/DB values have
safe local defaults — see comments in `.env.example`).

### 2. Backend (FastAPI)

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate      # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

API runs at http://localhost:8000 — docs at http://localhost:8000/docs
Health check: http://localhost:8000/health

### 3. Frontend (Next.js)

```bash
cd apps/web
npm install
npm run dev
```

Web app runs at http://localhost:3000

## Development database

Local development uses SQLite (`apps/api/budget_buddy.db`, git-ignored).
Production uses PostgreSQL via the same SQLAlchemy models. Schema changes are
managed through Alembic migrations — never edit the SQLite file by hand.

## Testing

```bash
# Backend
cd apps/api && pytest

# Frontend
cd apps/web && npm test
```

## Documentation

See [docs/architecture.md](docs/architecture.md),
[docs/development.md](docs/development.md),
[docs/api.md](docs/api.md),
[docs/deployment.md](docs/deployment.md),
[docs/security.md](docs/security.md), and
[docs/product-decisions.md](docs/product-decisions.md).

## Project status

Under active phased development. See `docs/product-decisions.md` for the
current phase and what is/isn't implemented yet.
