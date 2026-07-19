# 04 — Engine Specifications & Validation Pipeline

This is the concrete implementation reference for each Engine named in
`03-system-and-engine-architecture.md`. Read the relevant section before implementing or
modifying that Engine.

## The Full Validation Pipeline

```
Project → Environment → Authentication → Discovery → Browser Collection →
Validation Engines (parallel) → Confidence Engine → Evidence Engine →
AI Explanation → Report
```

## Discovery Engine

**Responsibilities:** crawl configured URLs, build page inventory, skip excluded routes, remove
duplicate pages.
**Output:** page list, route metadata.

## Browser Engine

**Technology:** Playwright.
**Responsibilities:** launch browser, authenticate, navigate pages, capture screenshots, extract
DOM, extract computed CSS, capture network activity, capture console logs, capture accessibility
tree.
**Output:** browser session, screenshots, DOM snapshots, network logs.

> **The Browser Engine performs collection only. It never determines whether something is
> correct.** This separation is one of the most important lines in the whole architecture —
> don't let validation logic creep into browser-collection code.

## Figma Engine

**Technology:** Figma REST API.
**Responsibilities:** download design metadata, cache Figma files, extract frames/components,
prepare design data for comparison.
**Output:** design structure, component metadata.
**Rule:** parsed Figma data must be cached — never re-download the same design repeatedly.

## Element Matching (runs before visual/UI comparison)

Before comparing pixels or attributes, tentwenty QA Studio matches Figma components to website elements using:
text, position, size, parent, component type, accessibility role, and visual similarity (and, per
the technical architecture doc: element ID, data attributes, accessible labels, DOM hierarchy).

**Why this exists:** this is the concrete mechanism that keeps false positives down when layout
shifts but content is actually unchanged — directly serves DNA 01 (accuracy) and Pain 017 (low
trust in existing automation). Do not skip element matching to go straight to pixel diffing.

## UI Validation Engine

**Validates:** layout, components, visibility, position, spacing, typography.
**Output:** UI findings with supporting evidence.

## Visual Engine

**Technology:** Pixelmatch, OpenCV.
**Workflow:**
```
Reference Screenshot → Current Screenshot → Pixel Comparison →
Difference Detection → Finding
```
**Responsibilities:** compare screenshots, detect visual differences, ignore approved dynamic
regions where configured.
**Rule:** visual comparison must respect Ignore Rules and Approved Differences (see below) — it
is not a raw pixel diff with no context.

## Content Engine

**Validates:** missing text, incorrect/unexpected text, placeholder content (including Lorem
Ipsum), empty fields/headings, typography consistency, readability, broken content.
**Two operating modes:**
1. Content Sheet → Website comparison (requires an approved content document)
2. Website-only grammar/readability/placeholder detection (no content sheet required)

**Output:** content findings.

## Functional Engine

**Validates:** buttons, links, forms, navigation, search, upload, download, pagination, filters,
authentication, user interactions, validation messages, success/error states.
**Rule:** only deterministic functional validation — no speculative "this might be broken."
**Output:** functional findings.

## Accessibility Engine

**Technology:** axe-core (V2 feature).
**Checks:** missing labels, WCAG violations, color contrast, heading structure, ARIA, keyboard
navigation, semantic HTML.
**Output:** accessibility findings.

## Performance Engine

**Technology:** Google Lighthouse (V2 feature).
**Measures:** Performance Score, LCP, CLS, INP, Accessibility Score, SEO Score, Best Practices.
Thresholds are configurable per project.

## Security Engine

**Status:** future (V3). Technology: OWASP ZAP. **Passive validation only — no penetration
testing.** Possible checks: security headers, HTTPS, cookies, TLS.

## Confidence Engine

**Responsibilities:** combine evidence/scores from all validation engines into one final
confidence score. Inputs may include: DOM match, visual match, content match, functional result.
**Output:** final confidence score per finding. This is the mechanism behind "no single engine
decides pass/fail alone" — even deterministic engines' individual scores are advisory inputs, not
final verdicts.

## Evidence Engine

**Responsibilities:** collect and organize evidence (screenshot, highlighted screenshot, DOM
snapshot, HTML, CSS, console log, network log, trace file). Evidence lives in object storage;
only metadata lives in PostgreSQL (see `05-database-and-api.md`).

## AI Engine

**Responsibilities:** generate human-readable explanations, suggested fixes, finding summaries,
executive summaries.
**Hard rule:** AI never determines whether a finding passes or fails. See
`06-ai-architecture.md` for the full provider/prompt/privacy rules.

## Report Engine

**Combines:** findings, evidence, confidence scores, AI explanations.
**Formats:** PDF, HTML, CSV.
**Output types:** Developer Report, Management Report, Executive Summary.

## Engine Output Standard (repeated here for convenience — see doc 03 for full schema)

Every engine returns: Engine Name, Status, Duration, Findings, Evidence, Errors, Metrics. No
custom response formats are permitted anywhere in the codebase.

## Ignore Rules vs. Approved Differences — two distinct concepts, don't conflate them

- **Ignore Rules**: suppress noise from *known-dynamic* content (dates, timestamps, session IDs,
  animated banners, ads) **without weakening validation** of everything else.
- **Approved Differences**: *intentional* UI changes a human has explicitly accepted once, stored
  so they don't re-trigger as findings in future audits unless the element changes again.

Ignore Rules solve "this is expected to always vary." Approved Differences solve "this was a
deliberate design update — update the baseline." Implement them as separate mechanisms.

## Caching Strategy

Cache reusable resources: Figma files, browser sessions (where safe), static assets,
configuration. Caching must reduce execution time **without** affecting validation accuracy —
never cache in a way that risks stale validation results.

## AI Strategy Within the Pipeline

AI runs **only after** deterministic validation completes, at the very end of the pipeline
(`... → AI Explanation → Report`). It explains, improves readability, suggests fixes, groups
similar issues — it never re-opens or changes a decision already made by a Validation Engine or
the Confidence Engine.

## Future Engines (architecture must accommodate without redesign)

API Validation Engine, Mobile Validation Engine, SEO Engine, Localization Engine, Compliance
Engine, Visual Regression AI Engine.

## Definition of Success — Engine Architecture

Each engine performs one responsibility only; engines execute independently; outputs are
standardized; every finding includes evidence; AI remains an enhancement layer, never a decision
maker; new engines can be added with minimal effort.
