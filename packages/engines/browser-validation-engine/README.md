# Browser Validation Engine

**Engine ID:** `browser-validation-engine` · **Prisma name:** `BROWSER_VALIDATION` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `browser-engine` (`sharedResources.pageArtifacts` — console messages, network
errors, screenshot).
**Supported validation types:** `Browser Validation`.

## Responsibility (docs/02, V1 scope)

> "Browser Validation: console errors, network errors, failed requests, broken resources, missing
> images."

Split out from the Functional Engine, which originally folded this in because docs/03's
`EngineName` enum had no dedicated slot for it. docs/02 lists Functional Validation and Browser
Validation as two **separate** V1 features, and CLAUDE.md non-negotiable #4 is explicit: "One
responsibility per Engine. An Engine never absorbs another Engine's job." Bundling them was a
scope violation, not a deliberate design choice — corrected here by giving Browser Validation its
own engine, its own `EngineName`/`ValidationType` enum value, and its own Audit Center checkbox.

Three checks, all deterministic, each aggregated into **one** Finding per page per check type
(CLAUDE.md non-negotiable #3 — fewer trusted findings over many noisy ones):

| Check | Category | Confidence | Severity | Data source |
|---|---|---|---|---|
| A JS error/uncaught exception logged during page load | Console Error | 0.90 (High) | High | `pageArtifacts.consoleMessages` |
| A failed request whose URL looks like an image | Missing Image | 0.92 (High) | Medium | `pageArtifacts.networkErrors` |
| A failed request for anything else (script, stylesheet, font, XHR/fetch) | Broken Resource | 0.92 (High) | High | `pageArtifacts.networkErrors` |

## Evidence

- **Console Error**: the page's uploaded console log (`CONSOLE_LOGS`), plus screenshot.
- **Missing Image / Broken Resource**: the page's uploaded network log (`NETWORK_LOGS`, which
  contains every request's status/method/URL, not just the failed ones — so the reviewer can see
  the failure in context), plus screenshot.

## Known simplifications (flagged, not silent)

- Console Error: counts every `console.error`/uncaught-exception message — doesn't distinguish an
  app's own intentional error logging (rare, but possible) from a genuine bug. No allowlist
  mechanism exists to suppress known-benign messages.
- Missing Image / Broken Resource: classified by file extension only (a fixed regex of common
  image extensions) — a mistyped or extensionless image URL would be miscategorized as "Broken
  Resource" rather than "Missing Image". Cosmetic (both still produce a real finding), not a
  correctness issue.
