# 03 — System & Engine Architecture

> **Implementation status (Phase B):** `packages/core` implements the Orchestrator and standard
> Engine interface described below exactly as written, plus one addition not yet in this doc: the
> `Engine` interface carries a `scope: "audit" | "page"` field. Audit-scoped engines (Discovery)
> run once; page-scoped engines (Browser, Content) run once per discovered page, sequentially —
> `packages/core/src/orchestrator.ts`'s `runPageScopedEngine`. A single page's failure only counts
> against that engine's `errorCount`; it doesn't fail the other pages or the audit (verified live:
> a real crawl of lipsum.com hit two downloadable-file links the Browser Engine correctly couldn't
> navigate to — the audit still completed the other 3 pages).
>
> Interim simplifications, flagged per docs/10's discipline rather than silently deviating:
> - **No BullMQ/Redis yet** — the Orchestrator runs engines in-process, synchronously within the
>   `startAudit` Server Action, not as queued background jobs. A real audit against ~20 pages
>   takes on the order of minutes (each page relaunches its own Chromium instance — see the
>   Browser Engine README); revisit once that latency is a real problem for users, not just a
>   known cost.
> - **Engine Registry is in-memory, single-process** (`packages/core/src/registry.ts`) — correct
>   for one Next.js process, but a real multi-worker deployment needs a shared registry instead.
> - **Pages execute sequentially within a page-scoped engine, not in parallel** — same in-process
>   constraint as above; real per-page parallelism needs the job queue.
>
> Engines that exist so far: **Discovery** (`discovery-engine`, audit-scoped, real crawl — also
> records same-origin broken links it observes as a side effect of crawling, into
> `sharedResources.brokenLinks`, with evidence text already uploaded), **Browser**
> (`browser-engine`, page-scoped, real Playwright — screenshot/DOM/console/network, uploaded to
> Supabase Storage), **Content** (`content-engine`, page-scoped, Mode 2 only — deterministic
> placeholder/empty-heading/missing-title checks against the Browser Engine's DOM snapshot;
> verified live against lipsum.com's real Lorem Ipsum content), **Functional**
> (`functional-engine`, page-scoped, broken-link findings only — the one check in docs/04's
> Functional Engine list achievable without actually driving the page; verified live with a real
> 404 link against a local fixture server), **Figma** (`figma-engine`, audit-scoped, real Figma
> REST API — downloads/caches a project's connected file via `Project.figmaFileUrl`/
> `figmaAccessToken`, extracts top-level frames/components into `sharedResources.figmaFrames` for
> the not-yet-built Element Matching Engine to consume later. The real "Connect Figma" flow
> (file URL + personal access token, verified against Figma's API before saving) replaces the
> earlier hardcoded UI stub. Only the failure path is live-verified so far — a bad token is
> genuinely rejected by Figma's API and nothing gets persisted; the success path (real frame
> extraction + `FigmaFileCache` reuse) is built and typechecked but not yet run against a real
> Figma file, since that needs a real personal access token no one has supplied yet). Every other
> Engine's `EngineResult` row is created at audit-start and stays `WAITING` — the Orchestrator
> deliberately leaves the audit honestly `RUNNING` rather than faking a `COMPLETED` pipeline that
> didn't actually validate anything.
>
> **Element Matching** (`element-matching-engine`) also exists now — docs/08 calls this "one of
> the most important systems in the platform," and this first slice implements exactly one of its
> six documented matching signals (text — a Levenshtein similarity ratio), not all of them.
> Position/size need Figma-frame-space-to-viewport-space coordinate reconciliation that isn't
> built; component-type/accessibility-role need a real Figma-type-to-DOM-tag mapping that isn't
> built; visual similarity needs the Visual Engine's image-diffing tech, which doesn't exist yet
> either. All three are real gaps, sequenced for later, not corners cut silently — see the
> engine's README. It isn't a user-selectable `ValidationType`; it rides along whenever `Figma
> Comparison` is selected, same treatment as Discovery/Browser always running. Its matching
> *algorithm* is verified against synthetic fixtures
> (`packages/engines/element-matching-engine/src/matching.verify.ts`, run manually — no test
> runner is wired up in this repo yet); the full engine against a real Figma file/rendered page is
> not, for the same reason the Figma Engine's success path isn't (needs a real Figma personal
> access token, not supplied yet).
>
> **UI Validation** (`ui-validation-engine`) also exists now — its first slice validates exactly
> what Element Matching's text-only signal can honestly support: a Figma text element with no
> live match ("Missing Design Element") and a matched element whose text isn't a near-perfect
> match ("Design/Live Text Mismatch"). Layout/position/spacing/component-type checks (the rest of
> docs/04's UI Validation list) aren't implemented — they need Element Matching to carry
> position/size/type data forward first, which it doesn't yet. Selecting `UI Validation` now also
> pulls in `FIGMA`/`ELEMENT_MATCHING` automatically (`audits.ts`), since UI Validation has nothing
> to compare against without them — same treatment `Figma Comparison` alone already had. Not
> live-verified for the same reason as Figma/Element Matching (no real Figma personal access token
> supplied yet).
>
> **Confidence** (`confidence-engine`) also exists now — the first Processing-category engine
> (docs/03 "no single Engine decides the final confidence"). Unconditionally included on every
> audit, it re-scores every Finding after Validation engines run, blending in two signals no
> single Validation engine can see on its own: evidence completeness (2+ evidence items, +0.02)
> and cross-audit recurrence (same project/engine/category seen in an earlier audit, +0.03),
> capped at 0.99. Boost-only by design — see its README for why a penalty signal isn't attempted
> yet. **Live-verified**, unlike the three engines above it: running a second real audit against
> the same lipsum.com environment showed the exact predicted math — Content Engine's 0.97
> baseline confidence became 0.99 (both bonuses fired, capped) on the recurrence of the same
> "Placeholder Content" category finding.
>
> **Visual** (`visual-engine`) also exists now — unconditionally included on every audit like
> Discovery/Browser/Confidence/Report. Implements docs/04's Visual Engine literally (Pixelmatch,
> "Reference Screenshot → Current Screenshot → Pixel Comparison"), with the Reference Screenshot
> being the most recent *prior audit's* screenshot of the same page (a new `PageScreenshot` table,
> written unconditionally by the Browser Engine, independent of whether any Finding ever
> references a given screenshot as Evidence) — audit-over-audit regression, not a Figma-baseline
> comparison. Confidence is deliberately capped at 0.75 (Medium) rather than higher, because
> docs/04's Visual Engine rule ("must respect Ignore Rules and Approved Differences... not a raw
> pixel diff with no context") isn't honored yet — neither mechanism exists in the schema. Fully
> live-verified without any Figma dependency: two real audits of an unchanged page produced zero
> findings; two real audits of a page with a deliberate, real content change (added, then removed)
> produced one correctly-scoped "Visual Regression" finding with a real diff percentage and a real
> uploaded diff image (the first engine to produce `HIGHLIGHTED_SCREENSHOT` evidence). See the
> engine's README for a flagged naming overlap with "Visual Regression" listed among *future*
> engines in this doc's own Scalability Rule section, below.
>
> **Functional** (`functional-engine`) was extended (v0.2.0) beyond broken links to also cover
> docs/02's V1-scope "Browser Validation" item (console errors, network errors, failed requests,
> broken resources, missing images) — there's no separate `EngineName` slot for it, and it's the
> same "judge data Browser Engine already collected" pattern as broken links, so it's folded in
> here rather than invented as a new engine. Three new checks, all reusing data Browser Engine was
> already capturing: Console Error (any `console.error`/uncaught exception during page load),
> Missing Image (a failed request whose URL looks like an image), Broken Resource (any other
> failed request — script/stylesheet/font/XHR). Live-verified against a real fixture page with a
> deliberate console error, a missing image, and a missing script: all three fired correctly,
> plus a bonus finding — Chromium itself logs resource-load failures to the console, so the
> Console Error check picked up those too, not just the explicit one (a real, welcome signal, not
> a bug).

## Architecture Philosophy

tentwenty QA Studio is **not** a monolith. It is a collection of independent Engines coordinated by a single
Core Platform. Every architectural decision must support: accuracy, speed, maintainability,
extensibility, reliability.

## High-Level System Diagram

```
User
 │
Next.js Frontend
 │
Core Platform API
 │
Engine Orchestrator
 │
 ┌────────────────────────────────────────┐
 │ Discovery Engine                       │
 │ Browser Engine                         │
 │ Figma Engine                           │
 │ Element Matching Engine                │
 │ UI Validation Engine                   │
 │ Content Engine                         │
 │ Functional Engine                      │
 │ Accessibility Engine                   │
 │ Performance Engine                     │
 │ Security Engine                        │
 │ Confidence Engine                      │
 │ Evidence Engine                        │
 │ AI Engine                              │
 │ Report Engine                          │
 └────────────────────────────────────────┘
 │
PostgreSQL / Supabase
 │
Object Storage (Supabase Storage / S3)
 │
Screenshots • Reports • Evidence • Logs
```

## Core Platform Responsibilities

The Core Platform is the **only** coordinator. It owns: authentication, project management,
engine registration, engine execution, job scheduling, progress tracking, result aggregation,
report generation, storage, audit history.

> **The Core Platform never performs validation. Validation belongs exclusively to Engines.**

## The One Rule Enforced Everywhere: No Direct Engine-to-Engine Communication

```
CORRECT:                          INCORRECT:
Engine → Core Platform → Engine   Engine → Engine → Engine
```

All coordination, data hand-off, and sequencing pass through the Core Platform / Orchestrator.
This is not just a guideline — it should be structurally impossible in code (e.g. Engines should
have no import/reference to another Engine's module).

## Engine Categories

| Category | Engines | Role |
|---|---|---|
| **Collection** | Discovery, Browser, Figma | Gather data only. Never judge. |
| **Validation** | UI, Visual, Content, Functional, Accessibility, Performance, Security | Deterministic judgment only. One concern per engine. |
| **Processing** | Confidence, Evidence, AI, Report | Synthesize what Validation Engines produced. |

## Engine Lifecycle (every Engine, no exceptions)

```
Registered → Initialized → Ready → Running → Completed → Archived
```

On error:
```
Running → Failed → Retry (optional, transient only) → Completed or Failed
```

**Retry policy:**
- Retry: browser crash, timeout, temporary network issue. Max **2 attempts**.
- Never retry: invalid configuration, authentication failure, missing project, invalid Figma
  file — these are permanent failures, not transient ones.

## Standard Engine Interface (mandatory — no custom shapes)

Every Engine implements exactly these five methods:

```
initialize()
validate()
collectEvidence()
calculateConfidence()
cleanup()
```

## Engine Registration

Every Engine registers at application startup and exposes: Engine ID, Name, Version,
Description, Dependencies, Supported Validation Types, Health Status.

## Engine Input (common shape, all Engines)

Minimum fields: Audit ID, Project ID, Environment, Page URL, Configuration, Browser Context,
Shared Resources. **Engines must not request data directly from other Engines** — only from the
shared input the Core Platform provides.

## Engine Output (standard shape, no custom formats)

```
Engine Result:
  - Engine Name
  - Status
  - Duration
  - Findings
  - Evidence
  - Metrics
  - Errors
```

## Finding Schema (shared platform-wide — this is the contract)

```
Finding:
  - Finding ID
  - Engine
  - Severity
  - Confidence
  - Category
  - Title
  - Description
  - Expected Result
  - Actual Result
  - Suggested Resolution
  - Evidence References
  - Timestamp
```

> **Platform extension (resolved during frontend build):** `Business Impact` was added as an
> additional field beyond this baseline contract — the Findings UI has a dedicated section for it,
> distinct from `Description`. Engines populate it the same way as `Suggested Resolution`. This is
> an additive extension, not a deviation — all fields above remain mandatory and unchanged.

## Evidence Schema

Evidence is **referenced, not embedded**. Supported types: Screenshot, Highlighted Screenshot,
DOM Snapshot, HTML Snapshot, CSS Snapshot, Console Logs, Network Logs, API Response, Trace File.
Each evidence item stores: Type, Storage Path, Created Time, Related Finding.

## Confidence Model

Each Engine assigns an **initial** confidence score for its own findings (e.g. DOM Match 100%,
CSS Validation 95%, Visual Validation 92%, Network Validation 100%). **No single Engine decides
the final confidence** — the Confidence Engine blends these into one final score. This is the
mechanism that keeps even deterministic engines from unilaterally deciding a finding's
reliability.

## Execution Strategy

Engines execute in dependency order where a dependency exists, but **independent Engines run in
parallel wherever possible** — this is a load-bearing performance requirement (DNA 07), not an
optimization to skip.

```
Discovery → Browser → UI → Content → Functional   (sequential dependency chain example)

Homepage:
  ├── UI Validation
  ├── Content Validation
  ├── Console Monitoring
  ├── Network Monitoring
  └── Screenshot Capture                            (parallel within a page)
```

Each page of an audit is also an independent execution unit — audits parallelize across pages,
not just across engines.

## Error Handling — Partial Failure Is Acceptable, Total Failure Is Not

```
Engine Failure → Log Error → Mark Engine Failed → Continue Remaining Engines →
Include Failure in Final Report
```

No single Engine may become a single point of failure for the whole audit.

## Logging (per Engine)

Every Engine logs: Start Time, End Time, Duration, Status, Findings Count, Error Count.
Logs must be structured and searchable — never plain unstructured text.

## Health Monitoring

Every Engine exposes one of: Healthy, Running, Waiting, Failed, Disabled. The Dashboard surfaces
this live.

## Versioning

Each Engine maintains its **own** version independently (e.g. UI Engine v1.2.0, Content Engine
v1.0.4). Engine updates must never require updating the entire platform.

## Configuration Hierarchy

```
Global → Project → Environment
```
Environment config overrides Project config; Project config overrides Global config.

## Scalability Rule

tentwenty QA Studio scales by **adding** Engines, not modifying existing ones. Future Engines (Mobile, API,
SEO, Localization, Visual Regression) must integrate through the existing framework without
requiring architectural redesign of what already exists.

## Definition of Done — for any new Engine

An Engine is complete only when it: registers successfully; executes independently; follows the
standard lifecycle; returns the standard output schema; generates evidence; integrates with the
Confidence Engine; integrates with the Report Engine; passes automated tests. No exceptions —
skipping any of these is not an acceptable shortcut even under deadline pressure.
