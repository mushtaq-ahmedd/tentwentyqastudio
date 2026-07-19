# Functional Engine

**Engine ID:** `functional-engine` · **Prisma name:** `FUNCTIONAL` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `discovery-engine` (`sharedResources.brokenLinks`), `browser-engine`
(`sharedResources.pageArtifacts` — console messages, network errors, screenshot).
**Supported validation types:** `Functional Validation`.

## Responsibility (docs/04 Functional Engine + docs/02's "Browser Validation")

> Functional Engine (docs/04): "Validates: buttons, links, forms, navigation, search, upload,
> download, pagination, filters, authentication, user interactions, validation messages,
> success/error states. Rule: only deterministic functional validation — no speculative 'this
> might be broken.'"
>
> Browser Validation (docs/02, V1 scope): "console errors, network errors, failed requests,
> broken resources, missing images."

Browser Validation has no dedicated slot in docs/03's `EngineName` enum — no `BROWSER_VALIDATION`
value exists. It's folded into this engine because it's the exact same pattern as the broken-link
check below: judge data the Browser/Discovery engines already collected, deterministically, with
no new capability required.

Four checks, all deterministic, each aggregated into **one** Finding per page per check type
(CLAUDE.md non-negotiable #3 — fewer trusted findings over many noisy ones):

| Check | Category | Confidence | Severity | Data source |
|---|---|---|---|---|
| A same-origin link Discovery couldn't reach while crawling | Broken Link | 0.95 (High) | High | `sharedResources.brokenLinks` |
| A JS error/uncaught exception logged during page load | Console Error | 0.90 (High) | High | `pageArtifacts.consoleMessages` |
| A failed request whose URL looks like an image | Missing Image | 0.92 (High) | Medium | `pageArtifacts.networkErrors` |
| A failed request for anything else (script, stylesheet, font, XHR/fetch) | Broken Resource | 0.92 (High) | High | `pageArtifacts.networkErrors` |

Broken Link is scored a touch below the other three (0.95 vs 0.92) since an occasional broken
link is more plausibly a transient network blip than the site's fault — a small but real
ambiguity the other three checks (a JS error or failed resource load *during this exact page
render*) don't have.

**Not implemented** — the rest of docs/04's Functional Engine list (forms, search, upload/
download, pagination, filters, authentication, user interactions, validation/success/error
messages): all of it requires actually *driving* the page — clicking, typing, submitting — which
is real browser interaction the Browser Engine doesn't do yet (it only renders and observes).
Building those without that capability would mean guessing, which CLAUDE.md's non-negotiable #1
rules out. Not implemented here, not faked.

## Evidence

- **Broken Link**: each broken link already carries its own evidence (a text description of the
  check — source page, target URL, HTTP status/error, timestamp — uploaded by Discovery at crawl
  time, before any Page row exists yet), plus the page screenshot.
- **Console Error**: the page's uploaded console log (`CONSOLE_LOGS`), plus screenshot.
- **Missing Image / Broken Resource**: the page's uploaded network log (`NETWORK_LOGS`, which
  contains every request's status/method/URL, not just the failed ones — so the reviewer can see
  the failure in context), plus screenshot.

## Known simplifications (flagged, not silent)

- Broken Link: same-origin links only — see the Discovery Engine README's matching note.
  Cross-origin broken links aren't checked at all.
- Console Error: counts every `console.error`/uncaught-exception message — doesn't distinguish an
  app's own intentional error logging (rare, but possible) from a genuine bug. No allowlist
  mechanism exists to suppress known-benign messages.
- Missing Image / Broken Resource: classified by file extension only (a fixed regex of common
  image extensions) — a mistyped or extensionless image URL would be miscategorized as "Broken
  Resource" rather than "Missing Image". Cosmetic (both still produce a real finding), not a
  correctness issue.
- No interaction-based checks (forms, buttons, search, pagination, filters, auth flows,
  upload/download, validation/success/error messages) — see above.
