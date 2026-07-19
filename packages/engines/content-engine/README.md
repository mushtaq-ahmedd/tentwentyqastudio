# Content Engine

**Engine ID:** `content-engine` · **Prisma name:** `CONTENT` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `browser-engine` (reads its DOM snapshot + extracted DOM elements from
`sharedResources.pageArtifacts`).
**Supported validation types:** `Content Validation`, `Grammar Validation` — both route to this
one engine (see `apps/web/src/lib/api/audits.ts`'s `VALIDATION_TYPE_TO_ENGINE`; there is no
separate Grammar Validation engine, by design — docs/09 names it as a user-facing validation
type, not a distinct engine in docs/03/04).

## Responsibility (docs/04 Content Engine — both modes)

### Mode 2 — website-only checks (always runs)

> "Website-only grammar/readability/placeholder detection (no content sheet required)."

Three deterministic checks against the Browser Engine's DOM snapshot, each **CLAUDE.md
non-negotiable #3** ("fewer, trusted findings beat many noisy ones") — one finding per category
per page, not one per match:

| Check | Confidence | Severity | Why this confidence |
|---|---|---|---|
| Placeholder content (Lorem Ipsum, TBD/TODO/FIXME, `[placeholder]`-style markers, "sample/dummy text") | 0.97 (Very High) | High | Exact deterministic string match — effectively no ambiguity. |
| Empty heading (`h1`–`h6` with no text **and** no image/svg child) | 0.88 (High) | Medium | Deterministic, but icon-only or intentionally-empty headings are a plausible (if rare) false-positive source — excluding any heading with a media child already filters the most likely one. |
| Missing/empty `<title>` | 0.90 (High) | Medium | Deterministic; no real ambiguity, but scored slightly below placeholder detection since a legitimately blank title is a marginally more defensible (if still wrong) choice than shipping Lorem Ipsum. |

### Mode 1 — Content Sheet → Website comparison (runs only when a Content Sheet exists)

> "Content Sheet → Website comparison (requires an approved content document)."

docs/04/docs/02 name this mode but specify **no file format, column schema, or matching rule** —
a genuine spec gap, not an oversight. The invented contract, kept deliberately narrow:

- **Format:** CSV only (no XLSX/PDF/DOCX — those need a materially heavier parsing dependency;
  out of scope for this slice). Uploaded via the existing `KnowledgeSource` / "Content Sheets"
  type — real file upload and "paste as text" are now both wired for this one source type (see
  `apps/web/src/components/modals/upload-knowledge-source-modal.tsx`); every other
  `KnowledgeSourceType` remains the pre-existing upload mock (deferred bug list).
- **Required columns** (case-insensitive header row): `Page`, `Expected Text`. Optional: `Element`
  (a human label carried into the finding for readability — not read programmatically).
- **Parsing happens once, at upload time** (`packages/core/src/content-sheet.ts`'s
  `parseContentSheetCsv`), not per-audit — the result (`{rows, errors}`) is stored on
  `KnowledgeSource.parsedContent`, and the row's status becomes `PROCESSED` (≥1 valid row) or
  `FAILED` (zero valid rows — surfaced in the Knowledge page with the specific parse errors, not
  silently dropped). The Orchestrator resolves the most recent `PROCESSED` Content Sheet for the
  project once per audit and puts its rows on `EngineContext.configuration.contentSheetRows` —
  this Engine never queries `KnowledgeSource` itself (docs/03).
- **Page matching:** a row's `Page` value is matched against a discovered page's URL **by path
  only** (`matchesPagePath` — `/pricing`, `pricing`, and `https://example.com/pricing/` all match
  the same page). Docs gave no convention; a QA-authored spreadsheet is far more likely to contain
  a path than a full origin URL.
- **Content matching:** for each row mapped to the current page, every DOM element captured by the
  Browser Engine (`artifacts.domElements` — the same candidate pool the Element Matching Engine
  uses for Figma comparison) is scored against the row's `Expected Text` via the shared
  `textSimilarity` (Levenshtein ratio, `packages/core/src/text-similarity.ts` — moved out of
  `element-matching-engine` into `core` so both engines share one implementation instead of two).
  The best-scoring element wins:
  - **≥ 0.85** (`CONTENT_MATCH_THRESHOLD`): considered a match — **no finding**. Matching content
    isn't evidence of a problem (CLAUDE.md non-negotiable #2). This threshold is higher than
    Element Matching's 0.82, since a content sheet's "Expected Text" is meant to be the literal
    approved copy, not just a visually-similar design label.
  - **< 0.3** (`NOT_FOUND_THRESHOLD`): "Missing Expected Content" (High severity, 0.95 confidence)
    — nothing on the page is even loosely related to the expected text.
  - Between the two: "Content Mismatch" (Medium severity, 0.85 confidence) — something exists but
    differs from the approved copy; both the expected and actual text are quoted in the finding.

## Evidence

Doesn't upload anything itself — every finding references the **same already-uploaded** Browser
Engine screenshot + DOM snapshot for that page (`sharedResources.pageArtifacts[url]`), per docs/03
"Evidence is referenced, not embedded" and CLAUDE.md non-negotiable #2 ("every finding requires
evidence").

## Known simplifications (flagged, not silent)

- Placeholder pattern list (Mode 2) is a fixed, hand-picked set — no real grammar/readability
  model yet (spelling, tone, reading-level scoring). That's a materially bigger feature; this is
  the narrowest honest slice of "Mode 2" that's genuinely deterministic today.
- No i18n — patterns and text-similarity comparisons are not locale-aware.
- Mode 1's DOM candidate pool is per-element **direct text only** (Browser Engine's
  `collectDomElements`, capped at 200 chars, one leaf element at a time) — a content sheet row
  whose expected text spans what the DOM renders as several sibling/nested elements won't find a
  single element that fully matches it, even though the content is genuinely present. Same
  documented limitation the Element Matching Engine already carries for Figma-vs-DOM matching;
  not re-solved here.
- Only CSV is supported for Content Sheets; XLSX/Google Sheets exports must be saved/exported as
  CSV first.
