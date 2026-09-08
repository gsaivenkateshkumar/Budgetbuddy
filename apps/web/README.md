# Budget Buddy — Web

Next.js (App Router, TypeScript, Tailwind CSS v4) frontend. See the root
[README](../../README.md) for full local setup and
[docs/development.md](../../docs/development.md).

```bash
npm install
cp ../../.env.example .env.local   # keep only NEXT_PUBLIC_API_URL
npm run dev
```

Runs at http://localhost:3000, talking to the API at
`NEXT_PUBLIC_API_URL` (default `http://localhost:8000`).

## Structure

```
app/               Routes (App Router)
components/
  layout/           Site shell: header, footer, container
  home/              Home-page sections
  product/           Product-related UI (ProductCard, ...)
  ui/                Small shared primitives (badges, ...)
lib/
  api/               Typed API client mirroring the backend's Pydantic schemas
  format.ts           Formatting helpers (currency, ...)
```

## Design

Tailwind's built-in palette: indigo (brand/trust), emerald (value/positive),
amber (used sparingly — freshness/caution, never a discount badge), slate
(neutral). Light theme only for now. See `app/globals.css`.

Data fetching follows Next.js App Router conventions: Server Components
fetch directly (`lib/api/products.ts`), pages read `searchParams` for
filters, and results are always fetched with `cache: "no-store"` since
price/availability freshness matters more than caching.
