# Confidence Engine

**Engine ID:** `confidence-engine` · **Prisma name:** `CONFIDENCE`
**Category:** Processing (docs/03: "Confidence, Evidence, AI, Report — synthesize what Validation
Engines produced").
**Scope:** `audit` — runs once per audit, after every Validation engine, over every Finding the
audit produced (not per page — it needs the whole picture, not one page's slice of it).
**Dependencies:** every current Finding-producing engine — `content-engine`, `functional-engine`,
`ui-validation-engine`. Collection-like engines (Discovery/Browser/Figma/Element Matching) aren't
listed — they never write Findings, so there's nothing of theirs to blend.
**Supported validation types:** none — not user-selectable, unconditionally included on every
audit (`apps/web/src/lib/api/audits.ts`), same treatment as Discovery/Browser/Report.

## Responsibility (docs/03 Confidence Model)

> "Each Engine assigns an **initial** confidence score for its own findings... **No single Engine
> decides the final confidence** — the Confidence Engine blends these into one final score. This
> is the mechanism that keeps even deterministic engines from unilaterally deciding a finding's
> reliability."

`Finding.confidence` was already documented in the schema (`packages/db/prisma/schema.prisma`,
written back in Phase A) as: "Set once by the Engine, then overwritten by the Confidence Engine's
blended score... never presented to the user as the Engine's own unilateral verdict." This engine
is exactly that overwrite step, made real.

## How blending works

Two deterministic signals, both **additive bonuses only** — this engine never lowers a score.
Each Validation engine already calibrates its own initial confidence carefully (see their READMEs
— e.g. Content Engine's placeholder detection at 0.97 vs. its empty-heading check at 0.88,
reflecting real differences in ambiguity); inventing a plausible *penalty* heuristic on top of
that risks double-guessing a judgment the originating engine already made deliberately. A
symmetric bonus signal — real corroborating evidence the originating engine couldn't see — avoids
that risk entirely.

1. **Evidence completeness** (+0.02): the finding has 2 or more evidence items attached (e.g. a
   screenshot *and* a DOM/network-log excerpt), not just one.
2. **Cross-audit recurrence** (+0.03): this exact project has seen this same `(engine, category)`
   combination before, in a *different* audit. A single Validation engine run only ever sees the
   current audit — it has no memory of past runs. Only something querying across the whole
   `Finding` table (this engine) can see that a category of issue keeps showing up, which is
   itself real corroborating signal that it's a genuine, persistent issue rather than a one-off.

Capped at 0.99 (never absolute certainty) after bonuses. Matched category, not exact title —
titles embed dynamic counts ("3 broken links found") that differ run to run for what is
conceptually the same recurring issue.

## Known simplifications (flagged, not silent)

- Recurrence matches at the `(project, engine, category)` granularity, not per-page or per-exact-
  finding. Coarser than ideal — a real issue on page A and an unrelated issue that happens to share
  a category on page B would both count as "recurring" for each other. Tightening this to compare
  by page URL too is a real improvement, not done in this first slice.
- Boost-only, no penalty path — see "How blending works" above for the reasoning. A real penalty
  signal (e.g. weighting down engines whose findings get rejected at a high rate by QA reviewers,
  via the existing `FindingStatus.REJECTED` mechanism) is a legitimate future addition once enough
  real accept/reject history exists to make it meaningful — there isn't any yet.
- One extra DB query per finding for the recurrence check (not batched) — fine at current audit
  sizes, would need optimizing for very large audits.
