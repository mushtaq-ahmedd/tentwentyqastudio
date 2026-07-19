# UI Validation Engine

**Engine ID:** `ui-validation-engine` · **Prisma name:** `UI_VALIDATION` · **Category:** Validation (docs/03)
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `element-matching-engine` (its actual data source), `browser-engine` (evidence
screenshot/DOM snapshot).
**Supported validation types:** `UI Validation`.

## Responsibility (docs/04 UI Validation Engine — first slice only)

> "Validates: layout, components, visibility, position, spacing, typography. Output: UI findings
> with supporting evidence."

This first slice validates exactly what the Element Matching Engine's current (text-only)
signal can honestly support — a coarse form of **visibility** and **typography** fidelity:

| Check | Confidence | Severity | Reasoning |
|---|---|---|---|
| **Missing Design Element** — a Figma text element with no matched live element (`ElementMatch.matched === false`) | 0.78 (Medium/High boundary, docs/07) | High | Real signal, but genuinely ambiguous: a miss could mean the element is truly absent, or just that Element Matching's text-only algorithm couldn't find it (dynamic content, the 500-element/200-char capture caps, wording that changed slightly). Confidence reflects that real uncertainty rather than overclaiming. |
| **Design/Live Text Mismatch** — a matched element whose text isn't a near-perfect match (`confidence < 0.98`) | 0.90 (High) | Medium | Lower ambiguity than the missing case: we *did* find a corresponding live element, and the exact text difference is directly observable, not inferred. |

**Layout, position, spacing** are explicitly **not implemented** — Element Matching's `ElementMatch`
doesn't carry position/size data forward yet (see its README's signal table), so there is nothing
honest to compare here. Building this means extending Element Matching first, not guessing here.
**Components** (as in: matching by component *type*, e.g. "this is a button") is likewise deferred
for the same reason.

## Evidence

Every finding on a page references that page's Browser Engine screenshot and DOM snapshot — same
already-uploaded artifacts other page-scoped engines reference, no re-upload.

## Known simplifications (flagged, not silent)

- Doesn't check for the reverse case — a live DOM element with no corresponding Figma element at
  all (an "unexpected" element not in the design). Element Matching's current output doesn't
  expose which DOM elements went unclaimed; adding that is a small addition to
  `matchElements()`'s return shape, not done yet.
- One aggregated finding per page per check type, not one per element (CLAUDE.md non-negotiable
  #3: "fewer, trusted findings beat many noisy ones") — the description lists up to 3 examples.
- Not live-verified against a real Figma file — same blocker as Figma/Element Matching: needs a
  real personal access token nobody has supplied yet. Typechecked and logically sound given
  Element Matching's (synthetic-fixture-verified) output shape, but the full chain hasn't run
  end-to-end for real.
