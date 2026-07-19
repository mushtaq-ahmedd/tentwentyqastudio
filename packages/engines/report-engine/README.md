# Report Engine

**Engine ID:** `report-engine` · **Prisma name:** `REPORT` · **Category:** Processing (docs/03/04:
"Combines: findings, evidence, confidence scores, AI explanations")
**Scope:** `audit` — runs once per audit, last in the pipeline (docs/04: `... → AI Explanation →
Report`).
**Dependencies:** `ai-engine`.
**Supported validation types:** none — not user-selectable, unconditionally included on every
audit since Phase A (before any real engine existed to fulfill it).

## Responsibility (docs/04 Report Engine)

> "Combines: findings, evidence, confidence scores, AI explanations. Formats: PDF, HTML, CSV.
> Output types: Developer Report, Management Report, Executive Summary."

Generates **4 files per audit**, each a real `Report` row with a real uploaded file (private
`reports` Supabase Storage bucket, separate from the `evidence` bucket — a report is a whole-audit
document, not per-finding proof):

| Type | Format | Content | Persona served (docs/02) |
|---|---|---|---|
| Developer Report | PDF | Every finding, every field, embedded screenshot where available | Developer — "should never need to ask QA for clarification" |
| Management Report | PDF | Stats by severity/engine, Critical+High findings only (title/severity/page, no full detail) | Engineering Manager — "high-level only... no implementation detail" |
| Executive Summary | PDF | Totals, release readiness recommendation, AI executive summary (if present) | Product Manager — "no technical detail" |
| Findings Export | CSV | One row per finding, all raw fields | Anyone doing spreadsheet analysis — the one format that isn't type-specific |

**HTML isn't a separately generated file** — docs/04 lists it as a format, but the app already
renders an equivalent live view in-browser (`/reports`, computed directly from Audit+Finding data)
so a static HTML export would be redundant. Flagged, not silently dropped — see `ReportFormat`'s
schema comment.

## How PDFs are generated

Plain HTML string templates (`html-templates.ts`, not JSX — this runs in Node/Playwright, not a
React tree) rendered to PDF via Playwright's `page.pdf()` (`pdf.ts`). **Not Puppeteer** — docs/08
explicitly lists Puppeteer among "technologies intentionally avoided," and Playwright is already
the sanctioned browser-automation tool (the Browser Engine already depends on it); reusing it here
avoids a second browser-automation dependency for what's ultimately the same underlying capability
(drive a real Chromium instance). Every dynamic value is HTML-escaped before interpolation —
finding text ultimately originates from real scraped web content, so this isn't optional.

The Developer Report embeds each finding's `SCREENSHOT` evidence inline as a base64 `<img>` — a
missing or expired evidence file just means that one finding renders without an image, not a
failed report (same partial-tolerance pattern as everywhere else).

## A real schema gap this engine required closing

`Report.format` didn't exist before this engine — the schema only had `type` (Developer/
Management/Executive), with no way to distinguish "Developer Report as PDF" from "Developer
Report as CSV" beyond guessing from the storage path's file extension. Added a real
`ReportFormat` enum (`PDF`, `CSV`) rather than working around the gap.

## Failure handling

Each of the 4 reports is generated and uploaded independently — one failing (a PDF render error,
an upload failure) is logged and skipped; the other three still get created (docs/03 "no single
Engine failure kills the whole audit"). The engine's `EngineResult` still reports `COMPLETED` even
if some reports failed, matching the same honesty principle as everywhere else: check the actual
`Report` rows for an audit if you need to know exactly what got generated.

## Known simplifications (flagged, not silent)

- No report caching/reuse — every audit regenerates from scratch, even if nothing about the
  underlying findings changed (there's no such case today, since Report always runs once per
  audit after everything else, but worth noting for a future "regenerate report" feature).
- Screenshot embedding is the only evidence type embedded in the PDF — DOM/console/network log
  evidence is referenced by type in the frontend Finding view, not inlined into the report
  document itself.
- No custom branding/logo — plain, functional styling only.
- Findings CSV is tagged `type: DEVELOPER` (the most technical/raw export) since `format` and
  `type` are independent axes and CSV isn't inherently "for developers" — a defensible but
  arbitrary choice, flagged rather than treated as obviously correct.
