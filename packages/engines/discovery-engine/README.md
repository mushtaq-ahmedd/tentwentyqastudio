# Discovery Engine

**Engine ID:** `discovery-engine`
**Category:** Collection (docs/03) — gathers data only, never judges.

## Responsibility

Crawls a project environment's base URL to build the page inventory every later engine
validates against (docs/04 "Discovery Engine"). Follows same-origin links breadth-first, skips
non-page links (`mailto:`, `tel:`, fragments, downloadable-file extensions), dedupes by
normalized URL, and stops at a page cap so a large site can't produce a runaway crawl.

As a side effect of fetching every same-origin link it follows, it also observes when one
returns an HTTP error or is unreachable — a real broken link, not a guess. It only *records*
this (`sharedResources.brokenLinks`, with an evidence text blob already uploaded to object
storage per docs/05) — per docs/03 Collection engines "gather data only, never judge" — the
Functional Engine turns each record into an actual Finding.

## Dependencies

None — always runs first (see docs/04's pipeline: `... → Discovery → Browser Collection → ...`).

## Supported validation types

None — Discovery isn't a user-selectable validation type (docs/09); it runs unconditionally on
every audit regardless of which validation types were selected, since every other engine needs
its page inventory to have anything to work on.

## Known simplifications (flagged, not silent)

- Plain `fetch()` + `cheerio` HTML parsing — no JS execution, so client-rendered SPA routes
  that only appear after hydration won't be discovered. The Browser Engine (Playwright) is
  where real rendered-DOM crawling belongs; this is a lightweight first pass.
- Hard-coded 20-page cap and 10s per-page fetch timeout — not yet configurable per project
  (docs/03's Configuration Hierarchy: Global → Project → Environment).
- Broken-link checking only covers same-origin links it was already going to fetch as part of
  crawling — cross-origin links (e.g. to a partner site) are never followed or checked at all.
  A real gap, not a hypothetical one, but checking every cross-origin href would meaningfully
  expand this engine's request volume; deliberately out of scope for this first pass.
