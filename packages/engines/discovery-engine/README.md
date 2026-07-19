# Discovery Engine

**Engine ID:** `discovery-engine`
**Category:** Collection (docs/03) — gathers data only, never judges.

## Responsibility

Crawls a project environment's base URL to build the page inventory every later engine
validates against (docs/04 "Discovery Engine"). Follows same-origin links breadth-first, skips
non-page links (`mailto:`, `tel:`, fragments), dedupes by normalized URL, and stops at a page
cap so a large site can't produce a runaway crawl.

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
