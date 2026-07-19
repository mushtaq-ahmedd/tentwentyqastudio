# Figma Engine

**Engine ID:** `figma-engine` · **Prisma name:** `FIGMA` · **Category:** Collection (docs/03)
**Scope:** `audit` — runs once per audit (a project has one connected Figma file, not one per
page).
**Dependencies:** none.
**Supported validation types:** `Figma Comparison` — only runs when the user selects it (like
every other Validation-type-gated engine, unlike Discovery/Browser which always run).

## Responsibility (docs/04 Figma Engine)

> "Technology: Figma REST API. Responsibilities: download design metadata, cache Figma files,
> extract frames/components, prepare design data for comparison. Output: design structure,
> component metadata. Rule: parsed Figma data must be cached — never re-download the same design
> repeatedly."

Fetches the project's connected Figma file (`Project.figmaFileUrl` + `Project.figmaAccessToken`,
read via `context.configuration` — the Orchestrator populates this from the Project row so the
engine never queries the DB directly for it, per docs/03's "Engines... only from the shared input
the Core Platform provides"), extracts every top-level frame/component from each Figma page
(a CANVAS node) into `sharedResources.figmaFrames`, and recursively walks each frame for
text-bearing (`TEXT` type) descendant nodes into `sharedResources.figmaElements` — the Element
Matching Engine's primary matching signal (docs/04 lists "text" first among matching criteria).

Like every other Collection engine, it **gathers data only — it never judges**. `validate()`
always returns `[]`.

## Caching (`packages/core/src/figma-cache.ts`)

Docs/04's caching rule is implemented for real, not just noted: before fetching the full Figma
document (which can be several MB for a complex file), the engine calls Figma's lightweight
`GET /v1/files/:key/meta` endpoint and compares its `last_touched_at` timestamp against the
project's last cached value (`FigmaFileCache` — a Postgres table, since no Redis/cache
infrastructure is provisioned yet; same interim-simplification pattern as the Orchestrator's
missing job queue). Only on a genuine mismatch does it fetch the full file and re-extract frames
and elements. The cache stores the **extracted** frame/component/element summary, not Figma's raw
document tree — "prepare design data for comparison" (docs/04) implies a distilled structure, not
an archived copy of the original file. The recursive element walk is bounded (depth 8, 1000
elements — `packages/core/src/figma-cache.ts`) so a large, deeply-nested file can't produce
unbounded cached data.

## Errors

- Missing/invalid Figma file URL or access token on the project → plain `Error`, permanent,
  never retried (docs/03: "Never retry: invalid configuration, authentication failure").
- Figma returns 401/403 (bad token) or 404 (file not found) → plain `Error`, same reasoning.
- Network failure/timeout reaching Figma's API → `TransientEngineError`, retried up to the
  Orchestrator's normal 2-attempt policy.

## Known simplifications (flagged, not silent)

- Only captures `TEXT`-type descendant nodes recursively — non-text nodes (rectangles, vectors,
  images, component instances with no text) aren't extracted at all yet. Fine for the Element
  Matching Engine's current text-only matching signal; will need extending once position/size/
  visual-similarity matching is attempted (see the Element Matching Engine's README).
- One Figma file per project (`Project.figmaFileUrl`/`figmaAccessToken` are single fields) — no
  support for multiple Figma files or per-environment Figma files.
- `Project.figmaAccessToken` is stored as a plain string column — no real encryption-at-rest,
  same simplification already present on `Environment.encryptedCreds` (whose "encrypted" naming
  is itself aspirational, not real). Flagged as a real security gap to close later, not something
  this engine solves.
- No automated test yet verified this against a real Figma file/token (requires a real Personal
  Access Token, which isn't something that can be fabricated) — code-reviewed and typechecked,
  but not live-verified the way Browser/Content/Functional engines were.
