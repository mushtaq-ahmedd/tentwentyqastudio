# Functional Engine

**Engine ID:** `functional-engine` · **Prisma name:** `FUNCTIONAL` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `discovery-engine` (`sharedResources.brokenLinks`), `browser-engine` (screenshot
evidence only).
**Supported validation types:** `Functional Validation`.

## Responsibility (docs/04 Functional Engine)

> "Validates: buttons, links, forms, navigation, search, upload, download, pagination, filters,
> authentication, user interactions, validation messages, success/error states. Rule: only
> deterministic functional validation — no speculative 'this might be broken.'"

**One check implemented — broken links.** The rest of docs/04's list (forms, search, upload/
download, pagination, filters, authentication, user interactions, validation/success/error
messages) all require actually *driving* the page — clicking, typing, submitting — which is real
browser interaction the Browser Engine doesn't do yet (it only renders and observes). Building
those without that capability would mean guessing, which CLAUDE.md's non-negotiable #1 rules out.
Not implemented, not faked.

| Check | Category | Confidence | Severity | Data source |
|---|---|---|---|---|
| A same-origin link Discovery couldn't reach while crawling | Broken Link | 0.95 (High) | High | `sharedResources.brokenLinks` |

0.95 confidence: an unreachable link during crawl is about as deterministic as this pipeline gets
(Discovery either got a working response or it didn't) — there's no interpretation involved.

## History

Previously this engine also covered console errors, missing images, and broken page resources —
docs/02's separate "Browser Validation" V1 feature, folded in here because docs/03's `EngineName`
enum had no dedicated slot for it. That was a **one-responsibility-per-Engine violation**
(CLAUDE.md non-negotiable #4) rather than a deliberate design choice, and confusingly bundled two
docs/02-distinct features behind a single "Functional Validation" checkbox with no way to run one
without the other. Split out into `browser-validation-engine` with its own `EngineName`,
`ValidationType`, and Audit Center checkbox.

## Evidence

Each broken link already carries its own evidence (a text description of the check — source page,
target URL, HTTP status/error, timestamp — uploaded by Discovery at crawl time, before any Page row
exists yet), plus the page screenshot (from the Browser Engine, referenced not re-derived).

## Known simplifications (flagged, not silent)

- Same-origin links only — see the Discovery Engine README's matching note. Cross-origin broken
  links aren't checked at all.
- No interaction-based checks (forms, buttons, search, pagination, filters, auth flows,
  upload/download, validation/success/error messages) — see above.
