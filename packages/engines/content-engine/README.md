# Content Engine

**Engine ID:** `content-engine` · **Prisma name:** `CONTENT` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `browser-engine` (reads its DOM snapshot from `sharedResources.pageArtifacts`).
**Supported validation types:** `Content Validation`, `Grammar Validation` — both route to this
one engine (see `apps/web/src/lib/api/audits.ts`'s `VALIDATION_TYPE_TO_ENGINE`; there is no
separate Grammar Validation engine, by design — docs/09 names it as a user-facing validation
type, not a distinct engine in docs/03/04).

## Responsibility (docs/04 Content Engine, Mode 2 only)

> "Website-only grammar/readability/placeholder detection (no content sheet required)."

Mode 1 ("Content Sheet → Website comparison") needs an approved content document to diff against —
that concept doesn't exist in the product yet, so it isn't implemented here. Building Mode 2 first
because it's the one genuinely achievable without an unmet dependency (unlike UI Validation, which
structurally needs a Figma baseline that doesn't exist yet either).

Three deterministic checks against the Browser Engine's DOM snapshot, each **CLAUDE.md
non-negotiable #3** ("fewer, trusted findings beat many noisy ones") — one finding per category
per page, not one per match:

| Check | Confidence | Severity | Why this confidence |
|---|---|---|---|
| Placeholder content (Lorem Ipsum, TBD/TODO/FIXME, `[placeholder]`-style markers, "sample/dummy text") | 0.97 (Very High) | High | Exact deterministic string match — effectively no ambiguity. |
| Empty heading (`h1`–`h6` with no text **and** no image/svg child) | 0.88 (High) | Medium | Deterministic, but icon-only or intentionally-empty headings are a plausible (if rare) false-positive source — excluding any heading with a media child already filters the most likely one. |
| Missing/empty `<title>` | 0.90 (High) | Medium | Deterministic; no real ambiguity, but scored slightly below placeholder detection since a legitimately blank title is a marginally more defensible (if still wrong) choice than shipping Lorem Ipsum. |

All three bands land at or above docs/07's 85% "High" confidence threshold — nothing here is
invented or guessed; every check is a plain deterministic DOM/text match.

## Evidence

Doesn't upload anything itself — every finding references the **same already-uploaded** Browser
Engine screenshot + DOM snapshot for that page (`sharedResources.pageArtifacts[url]`), per docs/03
"Evidence is referenced, not embedded" and CLAUDE.md non-negotiable #2 ("every finding requires
evidence").

## Known simplifications (flagged, not silent)

- Placeholder pattern list is a fixed, hand-picked set — no real grammar/readability model yet
  (spelling, tone, reading-level scoring). That's a materially bigger feature; this is the
  narrowest honest slice of "Mode 2" that's genuinely deterministic today.
- No i18n — patterns are English-only regexes.
- Doesn't yet implement Mode 1 (Content Sheet comparison) — see above.
