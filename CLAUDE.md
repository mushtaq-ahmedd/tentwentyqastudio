# CLAUDE.md — tentwenty QA Studio Development Rules

This file is auto-loaded every session. Keep it short — detailed domain reference lives in
`docs/`. **Read the relevant `docs/` file before writing code in that area.** Do not try to hold
the whole system in memory from this file alone.

## What tentwenty QA Studio Is

An AI-assisted QA Operating System that eliminates repetitive manual validation work. Built
first for internal engineering teams — not a replacement for QA Engineers, a replacement for
*repetition*.

**The one rule everything else derives from:**
> **Deterministic validation before AI.** Deterministic logic decides pass/fail, confidence, and
> whether a finding exists. AI only explains, summarizes, and suggests — after the fact, never
> before. If you're about to write code where an AI call determines a validation outcome, stop —
> that's architecturally wrong regardless of how well it might work.

## Non-Negotiables (violating any of these is a bug, not a style choice)

1. Deterministic validation before AI — always.
2. Every finding requires evidence. No evidence, no finding.
3. Accuracy before automation — fewer, trusted findings beat many noisy ones.
4. One responsibility per Engine. An Engine never absorbs another Engine's job.
5. Engines never communicate directly with each other — only through the Core Platform /
   Orchestrator.
6. Every Engine implements the same interface (`initialize / validate / collectEvidence /
   calculateConfidence / cleanup`) and returns the same output shape (Engine Result + Finding
   schema). No custom formats.
7. No single Engine failure may kill an audit — log it, mark it failed, continue the rest,
   report partial results.
8. AI never decides pass/fail, never invents missing information, never touches the live
   application directly, and its failure must never block report generation.
9. Documentation is the source of truth. If code and `docs/` disagree, `docs/` wins until
   someone updates it deliberately.
10. Parallel execution wherever engines/pages are independent — don't serialize work that doesn't
    need to be serial.

## Feature Acceptance Checklist — ask before building anything new

1. Which documented Pain ID (see `docs/01-...`) does this solve?
2. Is this repetitive work a human currently does by hand?
3. Can deterministic logic solve it (vs. requiring AI judgement)?
4. How much QA time does it save?
5. Will QA Engineers use it every release?
6. Does it increase trust (accuracy / evidence / repeatability)?
7. Does it fit the existing Engine Framework without redesigning what already works?

If most answers are "no" — don't build it yet, or flag it for discussion first.

## V1 Scope Fence — do not build these early even if they're easy

**Out of scope until V2/V3:** accessibility validation, performance validation, API validation,
mobile testing, cross-browser testing, security scanning, CI/CD integration, Jira/Slack/email
integrations, plugin marketplace, **AI-generated test cases**, **autonomous exploratory
testing**.

**V1 scope is:** project/environment management, UI validation, Figma comparison, content
validation (both modes), functional validation, browser validation (console/network), evidence
collection, AI reporting (narration only), reports (PDF/CSV), dashboard.

Full detail: `docs/02-personas-and-roadmap.md`.

## Where To Look

| Task touches... | Read first |
|---|---|
| Whether/why a feature should exist, product philosophy | `docs/01-product-vision-and-principles.md` |
| Users, workflows, what's in V1/V2/V3 | `docs/02-personas-and-roadmap.md` |
| Orchestrator, Engine lifecycle, Engine communication rules | `docs/03-system-and-engine-architecture.md` |
| A specific Engine's behavior, or the validation pipeline | `docs/04-engine-specifications-and-pipeline.md` |
| Database schema, API endpoints, auth, response format | `docs/05-database-and-api.md` |
| Anything involving an AI/LLM call | `docs/06-ai-architecture.md` |
| Accuracy targets, benchmarks, release gating | `docs/07-accuracy-benchmark.md` |
| Choosing a library/framework | `docs/08-technology-stack.md` |
| Dashboard layout, screens, empty/error/loading states | `docs/09-dashboard-ux.md` |
| Repo structure, branching, PR review, testing strategy | `docs/10-development-guidelines.md` |
| Environments, infra, CI/CD, secrets, monitoring, rollback | `docs/11-deployment-architecture.md` |

Full index and original-doc mapping: `docs/00-index.md`.

## Quality Bar (release gate — see `docs/07-...` for full detail)

Accuracy ≥95%, Precision ≥95%, Recall ≥90%, False Positive Rate ≤5%, False Negative Rate ≤10%.
Every finding must carry a confidence score and be labeled Very High / High / Medium / Low
per the thresholds in `docs/07-accuracy-benchmark.md` — never presented as uniformly certain.

## Working Agreement for This Repo

- When implementing an Engine: confirm it follows the standard interface and output schema in
  `docs/03-...` *before* writing business logic — the contract is not optional scaffolding.
- When touching the DB or API: check `docs/05-...` for the existing schema/endpoint shape before
  adding a new table or route — extend the pattern, don't invent a parallel one.
- When adding anything AI-related: check `docs/06-...` for the provider-abstraction and
  hallucination-prevention rules first.
- Prefer clarity over cleverness. Avoid premature optimization and unnecessary abstraction.
- If a request would violate a Non-Negotiable above, say so explicitly rather than quietly
  working around it.
