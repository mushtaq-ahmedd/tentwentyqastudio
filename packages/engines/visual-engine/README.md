# Visual Engine

**Engine ID:** `visual-engine` · **Prisma name:** `VISUAL` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `browser-engine`.
**Supported validation types:** none — not user-selectable (no matching `ValidationType`,
docs/09); unconditionally included on every audit (`apps/web/src/lib/api/audits.ts`), same
treatment as Discovery/Browser/Confidence/Report.

## Responsibility (docs/04 Visual Engine)

> "Technology: Pixelmatch, OpenCV. Workflow: Reference Screenshot → Current Screenshot → Pixel
> Comparison → Difference Detection → Finding. Responsibilities: compare screenshots, detect
> visual differences, ignore approved dynamic regions where configured. Rule: visual comparison
> must respect Ignore Rules and Approved Differences — it is not a raw pixel diff with no
> context."

**A note on scope, read this before assuming Figma involvement:** docs/04 doesn't say the
"Reference Screenshot" must come from Figma, and the "Ignore Rules"/"Approved Differences"
concepts it requires ("intentional UI changes... stored so they don't re-trigger... in future
audits") only make sense across multiple audits over time — which points at an audit-over-audit
baseline, not a one-time Figma comparison. This first slice implements exactly that: the
**Reference Screenshot is the most recent prior audit's screenshot of the same page**, found via
`PageScreenshot` (`packages/core/src/screenshot-history.ts`) — a durable record the Browser Engine
writes for every page it renders, independent of whether any Finding referenced that screenshot as
Evidence. (Separately, docs/03's "Scalability Rule" section lists "Visual Regression" among
*future* engines alongside Mobile/API/SEO/Localization — a naming overlap with what's built here,
surfaced rather than silently resolved one way. If that section meant something more advanced —
cross-browser regression, AI-assisted diff clustering — this first slice isn't that; it's the
literal docs/04 Visual Engine spec, audit-over-audit.)

## How it works

1. Downloads the current page's screenshot and the most recent prior audit's screenshot of the
   same page (`getPreviousScreenshotPath`) — skips entirely if this page has never been audited
   before (nothing to compare against) or if either screenshot fails to download.
2. Runs `pixelmatch` (not OpenCV — a much heavier native dependency not needed for plain pixel
   diffing) to count differing pixels, skipping the comparison if the two screenshots have
   different dimensions (forcing a resize would distort the result).
3. If more than 1% of pixels differ, uploads the diff image (pixelmatch's highlighted-difference
   overlay) as `HIGHLIGHTED_SCREENSHOT` evidence — the first engine to actually produce that
   evidence type — and creates one "Visual Regression" finding at 0.75 confidence (Medium band,
   docs/07) and Medium severity.
4. Every audit's screenshot is recorded regardless of whether this engine ran or found anything —
   it automatically becomes the next audit's comparison baseline (`recordPageScreenshot`, called
   unconditionally by the Browser Engine).

## Why confidence is capped at 0.75 (Medium), not higher

Docs/04's rule is explicit: visual comparison "must respect Ignore Rules and Approved
Differences... it is not a raw pixel diff with no context." Neither exists yet — there's no
schema, no configuration UI, no way to mark a region as legitimately dynamic (a rotating banner,
a live timestamp) or a past difference as intentionally approved. Every "Visual Regression"
finding from this engine **is** a raw pixel diff with no such context, despite what the docs/04
rule calls for — so it's scored accordingly rather than presented as more certain than it is.
Building Ignore Rules/Approved Differences is real, sequenced future work, not attempted here.

## Verification status

Fully live-verifiable without any Figma dependency, unlike Figma/Element Matching/UI Validation —
this engine only needs two audits of the same page. Verified: (1) two real audits of the same
unchanged page produce **no** finding (correctly below the 1% threshold), and (2) two real audits
of a page with a deliberate, real content change produce **one** correctly-scoped finding with a
real diff-percentage and a real uploaded diff image.

## Known simplifications (flagged, not silent)

- No Ignore Rules / Approved Differences — see above. This is the biggest gap relative to docs/04's
  literal requirement for this engine.
- Skips comparison entirely on any dimension mismatch, rather than attempting a partial/cropped
  comparison — a genuinely resized page produces no finding at all rather than a possibly-
  misleading one.
- Single global 1% pixel-difference threshold — no per-project or per-page tuning.
- OpenCV isn't used (see "How it works" above) — if a future need genuinely requires it (e.g.
  perceptual/structural similarity beyond raw pixel diffing), that's a real, separate addition.
