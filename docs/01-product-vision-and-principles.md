# 01 — Product Vision & Principles

## What tentwenty QA Studio Is

tentwenty QA Studio is an **AI-assisted Quality Assurance Operating System** built to eliminate repetitive
manual QA work while improving testing accuracy, consistency, and reporting quality. It is built
first for internal engineering teams — it is not a commercial testing product and it is not
trying to replace QA Engineers.

tentwenty QA Studio removes repetitive **deterministic** work so QA Engineers can spend more time on:
product understanding, business logic validation, exploratory testing, release confidence, and
risk analysis.

**Vision:** tentwenty QA Studio should be the first application opened whenever a new build becomes
available.

```
Receive Build → Open tentwenty QA Studio → Select Project → Select Environment →
Run Audit → Review Findings → Export Report → Begin Exploratory Testing → Release
```

**Mission:** Reduce repetitive QA effort without replacing human judgement. Automation removes
repetitive validation; humans stay responsible for product understanding, business rules,
exploratory testing, critical thinking, and release decisions.

## The Core Inversion (read this before building anything)

> **Deterministic validation before Artificial Intelligence.**

Whenever deterministic logic can solve a problem, deterministic logic wins. AI exists purely as
an enhancement layer on top of already-decided results:

| Deterministic (decides pass/fail) | AI (narrates only) |
|---|---|
| Missing button, broken link, missing image | Bug title & description |
| Wrong color, wrong font size, wrong padding | Business impact |
| Console error, failed API request | Suggested resolution |
| Layout/CSS/text/visual match scoring | Executive summary, grammar suggestions |

**AI must never decide pass/fail, confidence, or whether a finding exists.** This single rule is
restated near-verbatim across the README, Principles, AI Architecture, and Technical Architecture
docs — it is the most important guardrail in the entire platform.

## Why tentwenty QA Studio Exists — The Pain Register

Every feature must map back to a documented pain. Features that don't solve a real, named QA
problem should not be built. Full register (priority order):

**Priority 1 (Critical)**
| # | Pain | Current cost | Target | Solved by |
|---|---|---|---|---|
| 001 | Manual Figma comparison (layout, typography, color, components, icons, spacing) | 1–3 hrs/release | <10 min | UI Engine, Figma Engine, Element Matching, Visual Engine |
| 002 | Manual content comparison vs. approved copy | 30–90 min | <5 min | Content Engine |
| 003 | Grammar validation | manual | automatic | Content Engine, AI Engine |
| 009 | Form validation (required fields, invalid input, success/error flows) | 30–90 min | <10 min | Functional Engine |
| 013 | Bug writing | 2–5 min/issue | <15 sec | AI Engine, Report Engine |
| 015 | Inconsistent reporting across QA engineers | — | one standard format | Report Engine |
| 016 | Repetitive regression testing every release | — | automated | Multiple Validation Engines |
| 017 | Low confidence in existing automation (false positives, weak reports) | — | high-confidence findings only | Confidence Engine, Evidence Engine, Comparison Engine |
| 018 | Slow automation tooling | — | fast parallel execution | Engine Manager, Parallel Processing, Caching |

**Priority 2 (High)**
| # | Pain | Solved by |
|---|---|---|
| 004 | Content validation with no approved content sheet available | Grammar Engine, Content Engine |
| 005 | Broken links (20–60 min manual → <2 min) | Crawler Engine, Browser Engine |
| 006 | Broken images | Crawler Engine |
| 007 | Navigation validation (header/footer/sidebar/breadcrumbs) | Functional Engine |
| 010 | Console errors going unnoticed | Browser Engine |
| 011 | Network failures missed during manual testing | Browser Engine |
| 012 | Manual screenshot collection interrupting testing flow | Evidence Engine |
| 014 | Manual report preparation (dev/mgmt/exec/PDF/CSV) | Report Engine |

**Priority 3 (Medium)** — Pain 008 (button validation) → Functional Engine.

**Measurable success criteria** (from Problem Analysis): manual UI comparison reduced ≥80%,
manual content validation reduced ≥90%, bug writing reduced ≥90%, findings evidence-backed, false
positives minimal, engineers trust the platform.

## The 10 Non-Negotiables (Product DNA)

1. **Accuracy before automation** — an accurate tool with fewer findings beats an inaccurate tool
   with many. False positives are the #1 product failure mode.
2. **Deterministic before AI** — AI never decides pass/fail for a deterministic rule.
3. **Evidence before conclusion** — no evidence, no finding. Every issue carries at least one of:
   screenshot, highlighted screenshot, DOM/CSS/HTML snapshot, console log, network log, API
   response, computed styles.
4. **Trust above everything** — the #1 KPI is whether engineers stop manually re-verifying
   findings. Earned through accuracy, consistency, repeatability, clear evidence.
5. **Engineering first** — maintainability, stability, extensibility over feature count.
6. **Modular architecture** — one Engine, one responsibility. No Engine owns unrelated logic.
7. **Performance matters** — findings should stream continuously; never make the user wait for
   the full audit before seeing value.
8. **Simplicity wins** — the UI exposes business actions ("Run UI Validation"), never
   implementation details (OpenCV, Pixelmatch, Playwright, DOM parsing).
9. **Internal product first** — built to solve our own QA problems; commercial features never
   degrade internal usability.
10. **Continuous improvement** — every release should reduce repetitive QA effort, measured by
    accuracy and time saved, not feature count.

## Engineering Principles That Follow From the DNA

- **Single responsibility per Engine** — e.g. Content Engine does content validation only; it
  must never also generate reports or send notifications.
- **Loose coupling** — Engines communicate *only* through the Core Platform. Direct
  Engine → Engine communication is never allowed (see `03-system-and-engine-architecture.md`).
- **Reusable components** — comparison logic, screenshot capture, confidence scoring, evidence
  handling must be shared, not duplicated per-Engine.
- **Configuration over hardcoding** — thresholds, ignore rules, tolerances, timeouts, retry
  counts should be configurable wherever practical.
- **Version compatibility** — new Engines integrate without redesigning existing ones.
- **Validation output must be measurable and reproducible** — "The primary CTA font size is 14px
  instead of 16px," never "the page looks different." Same input → same output, always.
- **Reports require almost no manual editing** — every finding includes title, description,
  expected/actual result, business impact, suggested resolution, evidence, confidence.
- **Security** — passwords, API keys, session tokens, secrets are never exposed and always
  encrypted; production environments require explicit confirmation before execution.
- **Code quality** — prioritize readability, testability, modularity, documentation; avoid
  premature optimization and unnecessary abstraction; prefer clarity over cleverness.
- **Database stores facts** — business logic lives in the application layer, not the DB; don't
  store unnecessary derived values.

## Feature Acceptance Checklist

Before building **any** feature, answer all of these. If the answer is "no" to most, reconsider
the feature:

1. Which documented Pain ID does this solve?
2. Is this repetitive work?
3. Can deterministic validation solve it (vs. requiring AI judgement)?
4. How much QA time does it save?
5. Will QA Engineers use it every release?
6. Does it increase trust (accuracy, evidence, repeatability)?
7. Does it fit the existing Engine Framework without architectural redesign?

## Definition of Excellence (product-wide)

tentwenty QA Studio is succeeding when: engineers trust the findings; reports require minimal editing;
manual comparison work is significantly reduced; findings are evidence-backed; false positives
stay minimal; new Engines integrate without architectural change; QA Engineers spend more time
improving software quality and less time repeating deterministic validation.

## Final Statement

> Build the most accurate, trustworthy, and engineering-focused QA Operating System possible,
> where deterministic validation provides the foundation and AI enhances understanding — never
> judgement.

**Documentation precedence:** whenever implementation and documentation conflict, documentation
wins until officially updated. No implementation should rely on assumptions not written down
here.
