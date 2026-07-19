# AI Engine

**Engine ID:** `ai-engine` · **Prisma name:** `AI` · **Category:** Processing (docs/03/docs/06:
"Validation Engines → Confidence Engine → Evidence Engine → AI Engine → Final Report")
**Scope:** `audit` — runs once per audit, after Confidence has blended every Finding's score.
**Dependencies:** `confidence-engine`.
**Supported validation types:** none — not user-selectable, unconditionally included on every
audit (`apps/web/src/lib/api/audits.ts`), same treatment as Discovery/Browser/Confidence/Visual/Report.

## Responsibility (docs/06 AI Architecture)

> "AI is an enhancement layer, not the validation engine... AI Should: explain findings, improve
> readability, suggest possible fixes, generate executive summaries. AI Must Never: decide
> pass/fail, detect bugs independently, replace deterministic validation, modify audit results,
> access the live application directly, create new findings."

For every Finding in the audit, generates a short (`aiExplanation`) — a human-readable narrative
built strictly from that finding's own already-decided fields (title, severity, confidence,
description, expected/actual result, business impact, suggested resolution, evidence *types* —
never raw evidence content, and never anything about the live application). Then generates one
audit-level `aiExecutiveSummary` from aggregate statistics (finding counts by severity/engine).

**Never alters the original finding** — `aiExplanation` and `aiExecutiveSummary` are new,
additive columns (`Finding.aiExplanation`, `Audit.aiExecutiveSummary`); nothing this engine does
can change a finding's severity, confidence, or any other field a Validation engine or the
Confidence Engine already decided.

## Provider abstraction (`packages/core/src/ai/`)

docs/06: "Provider-agnostic via a common interface... switching providers should require only
configuration changes, never code changes to any Engine." This engine only ever calls
`AIProvider` (`packages/core/src/ai/types.ts`) — it has no vendor-specific code of its own.

`getConfiguredAIProvider()` (`packages/core/src/ai/resolver.ts`) reads **which provider and
model** to use from `PlatformSettings` (`platform_settings`, a single-row table docs/05 already
documents as holding "AI provider" — built in Phase A, discovered mid-way through building this
engine; the resolver was corrected to use it rather than inventing a parallel env-var-based
config). Only the **API key** comes from the environment (`ANTHROPIC_API_KEY`) — it's a secret,
and the settings table has no field meant to hold one. Returns `null` if no key is configured, or
the configured provider has no implementation.

Only one real implementation exists so far — `anthropic-provider.ts`. OpenAI/Gemini (docs/06's
other "initial providers") aren't implemented yet — `getConfiguredAIProvider()` logs a clear
warning and falls back to no AI content rather than silently pretending to support them.

**Known gap this engine inherited, not introduced:** the Settings page (`/settings`) genuinely
reads `aiProvider`/`aiDefaultModel` from this same table and displays them, but has no working
save path — the fields are inert `defaultValue` inputs with no form/server action behind them
(same class of bug as the already-tracked "Project Settings save button not wired"). Until that's
fixed, changing the configured provider/model means updating the `platform_settings` row directly
(SQL), not through the UI.

## Prompts (`packages/core/src/ai/prompts.ts`)

Version-controlled alongside the code (docs/06), not edited ad hoc. One shared system prompt
(`SYSTEM_PROMPT`) applies docs/06's hallucination-prevention rules to every call: be concise, use
only the provided information, never invent missing context, state uncertainty rather than
guess, never render a pass/fail judgment of its own.

## Failure handling (docs/06 "AI failure must never block report generation")

Three independent failure points, each degrading gracefully without affecting anything else:
- No provider configured at all → logs a warning, `initialize()` returns immediately, every
  finding simply has no `aiExplanation` and the audit has no `aiExecutiveSummary`.
- One finding's explanation call fails (rate limit, transient error) → logged, that finding's
  `aiExplanation` stays `null`, the loop continues to the next finding.
- The audit summary call fails → logged, `aiExecutiveSummary` stays `null`; per-finding
  explanations already written are unaffected.

The engine's own `EngineResult` still reports `COMPLETED` in all of these cases — "no AI content"
is a valid, honest outcome, not a failure of the pipeline (docs/03: an audit's real validation
results were never at risk).

## Verification status

The **failure path** (no `ANTHROPIC_API_KEY` configured) is live-verified: every finding in a real
audit correctly had `aiExplanation: null`, the audit had `aiExecutiveSummary: null`, and the
engine still reported `COMPLETED` with no impact on any other engine or the audit's real findings.
The **success path** (a real Anthropic API call producing a real explanation) has not been
live-verified — same category of gap as the Figma Engine's success path: it needs a real API key,
which hadn't been supplied as of this writing. Ask before assuming it works end-to-end.

## Known simplifications (flagged, not silent)

- Only Anthropic Claude is implemented; OpenAI/Gemini are named in docs/06 but not built.
- No caching of repeated prompts (docs/06 "Performance: cache repeated prompts where
  appropriate") — every finding gets its own call even if two findings are nearly identical
  (e.g. the same category recurring across pages).
- Sequential, not batched — one provider call per finding, one at a time, not parallelized.
- No token-usage/cost tracking or budget cap per audit.
