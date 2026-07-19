# Functional Engine

**Engine ID:** `functional-engine` · **Prisma name:** `FUNCTIONAL` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `discovery-engine` (the actual data source — `sharedResources.brokenLinks`),
`browser-engine` (only for an optional screenshot; not required for the check itself).
**Supported validation types:** `Functional Validation`.

## Responsibility (docs/04 Functional Engine — first slice only)

> "Validates: buttons, links, forms, navigation, search, upload, download, pagination, filters,
> authentication, user interactions, validation messages, success/error states. Rule: only
> deterministic functional validation — no speculative 'this might be broken.'"

This first slice implements **broken links only** — the one check in that list achievable from
data already collected, with no speculation. Everything else on that list (forms, search,
upload/download, pagination, filters, authentication, validation messages) requires actually
*driving* the page — clicking, typing, submitting — which is real browser interaction the Browser
Engine doesn't do yet (it only renders and observes). Building those without that capability
would mean guessing, which CLAUDE.md's non-negotiable #1 rules out. Not implemented here, not
faked.

## How the check works

The Discovery Engine already fetches every same-origin link it follows while crawling (that's how
it decides whether to keep crawling a page). When one of those fetches returns an HTTP error or
is unreachable, Discovery records it (`sharedResources.brokenLinks`) — a real observed fact, not
a guess — but doesn't judge it (docs/03: Collection engines "gather data only, never judge"). This
engine turns each page's broken links into one aggregated Finding (not one per link — CLAUDE.md
non-negotiable #3, fewer trusted findings over many noisy ones) at 0.95 confidence (High band,
docs/07) — high but not "Very High", since an occasional broken link is a transient network blip
rather than the site's fault, a small but real ambiguity the Content Engine's checks don't have.

## Evidence

Each broken link already carries its own evidence — a text description of the check (source page,
target URL, HTTP status/error, timestamp) uploaded by Discovery at crawl time, before any Page row
(and thus any real pageId) exists yet. This engine references those paths directly, plus the
page's screenshot if the Browser Engine rendered it (visual context, not required for the finding
to be valid).

## Known simplifications (flagged, not silent)

- Same-origin links only — see the Discovery Engine README's matching note. Cross-origin broken
  links aren't checked at all.
- No image/asset reachability checking (broken `<img>` etc.) — only anchor-link navigation
  targets, since that's what Discovery's crawl already probes as a side effect.
- No interaction-based checks (forms, buttons, search, pagination, filters, auth flows,
  upload/download, validation/success/error messages) — see above.
