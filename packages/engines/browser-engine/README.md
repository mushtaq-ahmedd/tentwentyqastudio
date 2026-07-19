# Browser Engine

**Engine ID:** `browser-engine` · **Prisma name:** `BROWSER` · **Category:** Collection (docs/03)
**Scope:** `page` — runs once per discovered page, not once per audit.
**Dependencies:** `discovery-engine` (needs the page inventory before it can render anything).
**Supported validation types:** none — like Discovery, this always runs; it isn't a user-selectable
`ValidationType` (docs/09), it's infrastructure every page-scoped Validation engine depends on.

## Responsibility

Renders one page in a real Chromium browser (Playwright) and captures the raw artifacts later
Validation engines need to actually judge something: full-page screenshot, DOM/HTML snapshot,
console messages (including uncaught page errors), network activity (every response's
status/method/URL, plus a filtered list of 4xx/5xx responses), and a structured list of rendered
text-bearing elements (`domElements` — tag, own direct text, real bounding box from
`getBoundingClientRect()`, and a curated computed-style summary from `getComputedStyle()` — color,
background color, font family/size/weight, display) for the Element Matching Engine's
text-matching candidates and future typography/color checks. Position and computed style both
specifically require a real rendered layout pass — neither can be derived from the static HTML
snapshot alone, which is why this engine (not a cheerio-style parser) is the one that collects them.

Per docs/03 Engine Categories: **gathers data only, never judges.** `validate()` always returns
`[]`. The five uploadable artifacts (screenshot, DOM snapshot, CSS snapshot, console/network logs)
go immediately to the private `evidence` Supabase Storage bucket via `uploadEvidence()`
(`packages/core/src/storage.ts`) — docs/05: evidence lives in object storage, never as blobs in
Postgres. Every screenshot is also recorded in `PageScreenshot` (`recordPageScreenshot()`,
`packages/core/src/screenshot-history.ts`) independent of whether any Finding ever references it
as Evidence — the Visual Engine needs a page's screenshot history regardless of whether a given
past audit found anything on it.

The resulting storage paths, plus the raw DOM HTML, console/network text, and
`domElements` (kept in memory for this run only — not uploaded as its own artifact separately
from the CSS snapshot, since nothing else needs it), are written to
`context.sharedResources.pageArtifacts[page.url]` for downstream engines (Content, Functional,
Element Matching) to consume without re-fetching or re-rendering anything.

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
- `domElements` capture is capped at 500 elements per page and only records an element's *own*
  direct text (not descendants') to avoid capturing the same text once per ancestor container —
  a genuinely content-heavy page will have candidates silently dropped past the cap.
- Computed-style capture is a **curated summary** (6 properties), not the full `CSSStyleDeclaration`
  (hundreds of properties per element) — a full dump would be large and mostly noise. Nothing
  consumes this yet (no engine does typography/color validation); it's collected ahead of that
  need, matching how Figma Engine/Element Matching were built before UI Validation could fully use
  them.
