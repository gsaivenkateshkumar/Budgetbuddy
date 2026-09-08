# Deployment

Not yet configured — this is Phase 16. Target architecture:

```
Browser → Next.js (managed hosting) → FastAPI (managed hosting) → managed PostgreSQL
```

Requirements once we get there: no Docker, HTTPS, GitHub-integrated deploys,
environment variables managed via each platform's secret store, India-viable
latency, free/low-cost starting tier. Specific providers will be evaluated
against current pricing/capabilities at deployment time rather than assumed
now.
