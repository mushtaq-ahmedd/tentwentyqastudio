# 11 — Deployment Architecture

> **Status: drafted default**, not sourced from an original tentwenty QA Studio document (none
> existed — see `00-index.md`). Consistent with the stack in `08-technology-stack.md`
> (Docker, PostgreSQL, Redis, BullMQ, Supabase Storage/S3, Sentry, Pino). Revise deliberately as
> real infrastructure decisions are made.

## Environments

| Environment | Purpose | Notes |
|---|---|---|
| Local | Individual development | Docker Compose, one-command startup |
| Development | Shared integration testing | Auto-deployed from `main` on merge |
| Staging | Pre-release verification, runs the accuracy benchmark suite | Mirrors production config |
| Production | Live internal use | Requires explicit confirmation before any audit execution against it — see `01-product-vision-and-principles.md` security principles |

This mirrors the Environment concept already in the product itself (`environments` table in
`05-database-and-api.md`) — don't confuse product environments (which a QA project audits)
with deployment environments (where tentwenty QA Studio itself runs). Keep the two concepts
named distinctly in code and infra config to avoid ambiguity.

## Infrastructure Components

```
Reverse Proxy (HTTPS termination)
        │
Next.js Frontend (apps/web)          Fastify API (apps/api)
        │                                     │
        └──────────────┬──────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
   PostgreSQL         Redis         Object Storage
   (Prisma)      (BullMQ / cache)   (Supabase / S3)
        │
  Background Workers (BullMQ consumers: audits, report gen, screenshot processing, AI calls)
```

All production infrastructure runs in **Docker containers** per `08-technology-stack.md`.
Production OS target is **Linux**.

## Environment Variables & Secrets

- Managed via the deployment platform's secret store (never committed, never logged — same rule
  as `10-development-guidelines.md`).
- Minimum required set: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `OBJECT_STORAGE_*` credentials, `FIGMA_API_TOKEN`, AI provider keys (`OPENAI_API_KEY` /
  `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` — only the ones actually configured per
  `06-ai-architecture.md`'s provider abstraction), `SENTRY_DSN`.
- Rotate secrets on a defined schedule; a leaked key is a security incident, not a routine event.

## Background Job Architecture

Every page-level audit task is its own BullMQ job (per `03-system-and-engine-architecture.md`'s
parallel-execution requirement). Workers scale horizontally and independently from the API
process — this is what lets independent Engines/pages actually run in parallel in production,
not just in theory.

## CI/CD Pipeline (stages, in order)

1. **Lint & type-check** — blocks merge on failure
2. **Unit tests** — per-Engine tests against the benchmark dataset (`07-accuracy-benchmark.md`)
3. **Integration tests** — Orchestrator + partial-failure handling
4. **Build** — Docker images for `apps/web` and `apps/api`
5. **Deploy to Development** — automatic on merge to `main`
6. **Deploy to Staging** — manual promotion; runs the full accuracy benchmark suite
7. **Release gate** — per `07-accuracy-benchmark.md`'s Release Criteria: all critical tests pass,
   benchmark metrics meet targets, no critical regressions, reports generate successfully,
   evidence produced for all findings
8. **Deploy to Production** — manual promotion only after the release gate passes

No stage may be skipped to hit a deadline — the Release Criteria in doc 07 are a hard gate, not
a checklist to override.

## Database Migrations

- Prisma migrations are version-controlled and applied automatically as part of the deploy
  pipeline (Development/Staging), and manually confirmed for Production.
- **Audit data is immutable after completion** (`05-database-and-api.md`) — migrations must never
  retroactively alter completed audit/finding records; only additive schema changes to historical
  tables are acceptable without an explicit, separately-reviewed data migration plan.

## Monitoring & Observability

- **Sentry**: application errors, exceptions, performance monitoring in all non-local
  environments.
- **Pino** structured logs shipped to a central log store — every log includes Timestamp, Engine,
  Audit ID, Project, Event, Duration, Status per `03-system-and-engine-architecture.md`.
- **Health monitoring**: Engine Health, Queue Length, Active Audits, Failed Audits, Average
  Execution Time, Memory/CPU/Storage usage — surfaced on the Dashboard per
  `09-dashboard-ux.md`, and alertable in Staging/Production.

## Rollback Strategy

- Container images are immutable and tagged by commit SHA — rollback is redeploying the prior
  tag, not patching forward under pressure.
- Database migrations should be written to be reversible where feasible; irreversible migrations
  require a documented manual rollback plan before deploy.

## Production Safety

- Running an audit against a Production environment requires explicit user confirmation in the
  UI — this is a product-level rule (doc 01/09), not just an infra one.
- Secrets/credentials for Production environments follow the same never-logged,
  never-exposed rule as everywhere else in the platform.

## Definition of Excellence — Deployment

Deploys are reproducible and automated up to the release gate; Production changes always pass
through the accuracy benchmark gate first; rollback is fast and safe; no secret or sensitive
data ever appears in logs, error reports, or version control.
