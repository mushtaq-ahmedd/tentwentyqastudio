# Element Matching Engine

**Engine ID:** `element-matching-engine` · **Prisma name:** `ELEMENT_MATCHING`
**Category:** not in docs/03's Collection/Validation/Processing table — it sits between them:
prepares data like a Collection engine (never produces a Finding), but performs real matching
*judgment* like a Validation engine. Treated here as Collection-like: `validate()` always
returns `[]`.
**Scope:** `page` — runs once per discovered page.
**Dependencies:** `figma-engine`, `browser-engine`.
**Supported validation types:** none — not user-selectable (docs/09 has no "Element Matching"
option). Always included whenever `Figma Comparison` is selected (`apps/web/src/lib/api/audits.ts`),
the same unconditional-inclusion treatment as Discovery/Browser.

## Responsibility (docs/04 "Element Matching (runs before visual/UI comparison)")

> "Before comparing pixels or attributes, tentwenty QA Studio matches Figma components to website
> elements using: text, position, size, parent, component type, accessibility role, and visual
> similarity... Do not skip element matching to go straight to pixel diffing."

docs/08 calls this "one of the most important systems in the platform." This first slice
implements exactly **one** of those six signals — **text** — deliberately, not as an oversight:

| Signal | Status | Why |
|---|---|---|
| Text | **Implemented** | The only signal with no external dependency — a Levenshtein similarity ratio (`matching.ts`) between a Figma `TEXT` node's `characters` and a DOM element's own direct text. |
| Position / size | Not implemented | Figma frame coordinates and browser viewport coordinates don't share an origin or scale — comparing them meaningfully needs real coordinate-system reconciliation (e.g. normalizing both to a 0–1 range relative to their frame/viewport), which risks silently-wrong results if done carelessly. A real gap to close, not skipped for convenience. |
| Parent / component type / accessibility role | Not implemented | Needs a real mapping from Figma node types/names to DOM tags/ARIA roles, which is inherently heuristic — better to add deliberately once text-matching's accuracy is measured, than guess now. |
| Visual similarity | Not implemented | Needs real image-diffing infrastructure (Pixelmatch/OpenCV — the Visual Engine's technology, docs/04), which doesn't exist yet. |

## How it works

1. For the current page, picks the Figma frame whose **name** best matches the page's name
   (`bestMatchingFrame` in `matching.ts`) — e.g. a page named "Homepage" against a Figma frame
   named "Homepage". Falls back to comparing against every text element in the whole file if
   nothing clears a loose threshold (handles files with no naming convention, at the cost of more
   cross-frame false-positive risk).
2. Greedily matches each Figma text element (in extraction order) to the best-scoring unclaimed
   DOM element above `MATCH_THRESHOLD` (`matchElements` in `matching.ts`) — not a full optimal
   assignment (e.g. the Hungarian algorithm), which would handle duplicate-text elements more
   rigorously but adds real complexity for a first slice.
3. Writes every match (and every deliberate non-match) to `sharedResources.elementMatches` for
   the not-yet-built UI Validation Engine to consume, and logs a structured summary (docs/03
   "Logging... structured and searchable") — currently the only way to inspect this engine's
   real output, since nothing downstream exists yet to surface it as a Finding.

## Verification status

The matching **algorithm** (`matching.ts`) is exercised directly against synthetic Figma/DOM
element fixtures — see the package's test note below — proving the text-similarity and
greedy-assignment logic behaves correctly in isolation. The **full engine**, wired to a real
Figma file and a real rendered page, has not been live-verified: that requires the Figma Engine's
success path (real frame/element extraction), which itself hasn't been live-verified yet either,
since no real Figma personal access token has been supplied. Flagged, not silently assumed
working.

## Known simplifications (flagged, not silent)

- See the signal table above — position/size/type/role/visual-similarity are real, sequenced
  future work, not corners cut carelessly.
- Greedy matching, not optimal assignment — see step 2 above.
- No persistence of match results between engines within an audit — `sharedResources` is
  in-memory only, which is fine since UI Validation (when built) would run in the same audit
  execution and read it directly; there's nothing to resume across separate runs.
