# 10 — Development Guidelines

> **Status: drafted default**, not sourced from an original tentwenty QA Studio document (none
> existed — see `00-index.md`). This encodes sensible conventions consistent with the stack in
> `08-technology-stack.md` and the Non-Negotiables in `CLAUDE.md`. Treat it as a living default —
> revise deliberately as the team's real practice diverges from it, and update this file when it
> does.

## Purpose

Defines how code actually gets written day-to-day: repo layout, naming, branching, review,
testing, and documentation expectations — so multiple sessions of Claude Code (and human
developers) produce consistent, mergeable output instead of divergent styles.

## Repository Structure (monorepo)

```
/apps
  /web              → Next.js + TypeScript frontend (dashboard, audit center, findings, reports)
  /api              → Fastify backend (or Next.js API routes for MVP)
/packages
  /engines          → One subfolder per Engine, each implementing the standard interface
    /discovery-engine
    /browser-engine
    /figma-engine
    /ui-engine
    /content-engine
    /functional-engine
    /confidence-engine
    /evidence-engine
    /ai-engine
    /report-engine
  /core             → Orchestrator, Engine Registry, shared types (Finding schema, Engine Result)
  /db               → Prisma schema, migrations, seed data
  /shared           → Cross-cutting utilities (logging, config loader, provider abstraction)
/docs               → This documentation set
CLAUDE.md
```

Each Engine is its **own package** with its own `package.json`, tests, and version — this is not
optional structure, it's the literal enforcement of "Engines are independently deployable"
(doc 03).

## Coding Standards

- TypeScript everywhere, `strict: true`. No `any` without an inline comment explaining why.
- Prefer explicit types on exported functions/module boundaries; inference is fine internally.
- One exported responsibility per file where practical — mirrors "one responsibility per Engine"
  at the file level too.
- No engine package may `import` from another engine package directly — only from `/packages/core`
  or `/packages/shared`. This is the code-level enforcement of the no-direct-Engine-communication
  rule in `03-system-and-engine-architecture.md`.
- Linting: ESLint + Prettier, enforced in CI — a PR with lint errors does not merge.
- Avoid premature abstraction: don't build a generic plugin system for two use cases; wait for a
  third real one.

## Every Engine Package Must Include

- Implementation of `initialize / validate / collectEvidence / calculateConfidence / cleanup`
- Its own `package.json` with an independent semver version
- Unit tests for its validation logic
- A short `README.md` stating: Engine ID, responsibility, dependencies, supported validation
  types — mirrors the registration fields in doc 03

A PR adding or modifying an Engine that skips any of the "Definition of Done" items in
`03-system-and-engine-architecture.md` should not be merged.

## Git Workflow

- **Branch naming:** `feature/<engine-or-area>-<short-desc>`, `fix/<short-desc>`,
  `chore/<short-desc>` — e.g. `feature/content-engine-placeholder-detection`.
- **Commits:** conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`).
- **Main branch is always deployable.** Feature branches merge via PR only, never direct push.
- **PRs must state:** which Pain ID / roadmap item this addresses (ties back to the Feature
  Acceptance Checklist in `CLAUDE.md`), which Engine(s) are touched, and confirmation that the
  Engine Definition of Done is met (if applicable).

## Testing Strategy

| Layer | Requirement |
|---|---|
| Engine unit tests | Every Engine's `validate()` logic covered against the benchmark dataset described in `07-accuracy-benchmark.md` |
| Integration tests | Orchestrator correctly sequences engines, handles a failed Engine without killing the audit (per doc 03's error-handling flow) |
| API tests | Every endpoint validates input, returns the standard success/error envelope (`05-database-and-api.md`) |
| E2E tests | Full audit workflow: create project → run audit → findings appear → report generates |
| Regression | Re-run the benchmark dataset on every release per `07-accuracy-benchmark.md` — accuracy must not regress |

No Engine ships without unit tests against the benchmark dataset — this is not a "nice to have,"
it is the mechanism that keeps the ≥95% accuracy target in doc 07 honest.

## Code Review Checklist

Before approving any PR, confirm:
1. Does this respect the Non-Negotiables in `CLAUDE.md`?
2. If it's an Engine change — does it still follow the standard interface/output schema?
3. If it involves AI — does it stay within the boundaries in `06-ai-architecture.md`
   (no pass/fail decisions, no live-app access, structured input only)?
4. Are findings still evidence-backed?
5. Is there a test for the new behavior?
6. Does it introduce any Engine-to-Engine direct communication? (reject if so)

## Environment & Secrets (local dev)

- `.env.local` (never committed) holds: DB connection string, JWT secret, AI provider keys,
  Figma API token, Redis URL, object storage credentials.
- Provide a committed `.env.example` with all required keys, no real values.
- Never log secrets — this is enforced in `05-database-and-api.md`'s logging rule and applies
  identically to local dev logs.
- **Running locally**: `pnpm dev` (root) starts both the Next.js web app and the BullMQ audit
  worker together (via `concurrently`), labeled `web`/`worker` in the combined log output. Audits
  run as background jobs (docs/03/docs/08) — if only the web app is running (e.g. `pnpm --filter
  web dev` directly, or an editor task that doesn't use the root script), a started audit will sit
  at `RUNNING` with every engine stuck `WAITING` forever, since nothing is consuming the queue.
  Use `pnpm dev:web` / `pnpm dev:worker` only when you deliberately want to run just one (e.g.
  restarting the worker alone after an engine code change, without restarting the web server).

## Documentation Discipline

- If an implementation decision isn't covered by `docs/`, don't guess silently — flag it, and
  once resolved, update the relevant doc. Docs are the source of truth; an undocumented decision
  is a documentation bug waiting to happen.
- Any new Engine, endpoint, or table gets a corresponding update to the relevant `docs/` file in
  the same PR, not as a follow-up.

## Definition of Excellence — Development Process

Any engineer (or Claude Code session) can pick up a new task, know exactly where to add code,
which doc governs it, and merge without introducing inconsistency with the rest of the platform.
