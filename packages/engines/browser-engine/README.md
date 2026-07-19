# Browser Engine

**Engine ID:** `browser-engine` · **Prisma name:** `BROWSER` · **Category:** Collection (docs/03)
**Scope:** `page` — runs once per discovered page, not once per audit.
**Dependencies:** `discovery-engine` (needs the page inventory before it can render anything).
**Supported validation types:** none — like Discovery, this always runs; it isn't a user-selectable
`ValidationType` (docs/09), it's infrastructure every page-scoped Validation engine depends on.

## Responsibility

Renders one page in a real Chromium browser (Playwright) and captures the raw artifacts later
Validation engines need to actually judge something: full-page screenshot, DOM/HTML snapshot,
console messages (including uncaught page errors), and network activity (every response's
status/method/URL, plus a filtered list of 4xx/5xx responses).

Per docs/03 Engine Categories: **gathers data only, never judges.** `validate()` always returns
`[]`. All four artifacts are uploaded immediately to the private `evidence` Supabase Storage
bucket via `uploadEvidence()` (`packages/core/src/storage.ts`) — docs/05: evidence lives in
object storage, never as blobs in Postgres. The resulting storage paths, plus the raw DOM HTML
and console/network text (kept in memory for this run only), are written to
`context.sharedResources.pageArtifacts[page.url]` for downstream engines (Content, Functional, UI
Validation) to consume without re-fetching anything.

## Known simplifications (flagged, not silent)

- **One browser instance per page, not one shared instance per audit.** Simpler and safe against
  cross-audit state leaks in a single Node process (a module-level shared browser would leak
  across concurrent audits), at the cost of relaunch overhead per page. Revisit if audit latency
  becomes a problem — likely alongside the BullMQ/Redis queue work already flagged in docs/03,
  since a real job queue would also change how a shared browser pool could safely be scoped.
- **`waitUntil: "load"` + a fixed 1s settle, not `networkidle`.** `networkidle` never resolves on
  pages with long-lived connections (analytics beacons, websockets, polling) — it would make the
  whole engine time out on a large share of real sites. This trades a little completeness (some
  very late async console/network activity might be missed) for reliability.
- Hardcoded navigation timeout / settle time, not yet configurable per docs/03's Global → Project
  → Environment hierarchy — same gap noted in the Discovery Engine's README.
- No authenticated-session support yet — `environment.loginUrl` is threaded through
  `EngineContext` but this engine doesn't use it. Needed before this engine is useful against
  logged-in-only pages.
- Sequential across pages, not parallel — see `packages/core/src/orchestrator.ts`'s
  `runPageScopedEngine`; same in-process interim simplification already flagged in docs/03 for the
  missing job queue.
