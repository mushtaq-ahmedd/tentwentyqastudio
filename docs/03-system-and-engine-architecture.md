# 03 — System & Engine Architecture

> **Implementation status (Phase B, first slice):** `packages/core` implements the Orchestrator
> and standard Engine interface described below exactly as written. Two interim simplifications,
> flagged per docs/10's discipline rather than silently deviating:
> - **No BullMQ/Redis yet** — the Orchestrator runs engines in-process, synchronously within the
>   `startAudit` Server Action, not as queued background jobs. Fine for a single Discovery crawl;
>   revisit once Browser-driven engines make a single request-lifetime execution impractical.
> - **Engine Registry is in-memory, single-process** (`packages/core/src/registry.ts`) — correct
>   for one Next.js process, but a real multi-worker deployment needs a shared registry instead.
>
> Only the **Discovery Engine** (`packages/engines/discovery-engine`) exists so far. Every other
> Engine's `EngineResult` row is created at audit-start and stays `WAITING` — the Orchestrator
> deliberately leaves the audit honestly `RUNNING` rather than faking a `COMPLETED` pipeline that
> didn't actually validate anything.

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
