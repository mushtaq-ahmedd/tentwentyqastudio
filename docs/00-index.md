# tentwenty QA Studio Documentation Index

This `docs/` folder is the consolidated **source of truth** for tentwenty QA Studio, derived from the
original 15-document Product Bible. It replaces the raw documents for day-to-day development
reference. If the raw PDFs and this folder ever disagree, **this folder wins** — it is the
maintained, de-duplicated version.

The root `CLAUDE.md` is the file Claude Code reads automatically every session. It is
intentionally short. It points here for anything domain-specific.

## Map: task → document

| If you're working on... | Read |
|---|---|
| Product purpose, why a feature should/shouldn't exist, the 10 DNA principles | `01-product-vision-and-principles.md` |
| Who uses tentwenty QA Studio, what "done" feels like for them, V1/V2/V3 scope | `02-personas-and-roadmap.md` |
| Orchestrator, Engine lifecycle, how Engines communicate | `03-system-and-engine-architecture.md` |
| Any specific Engine's responsibilities (UI, Content, Functional, Visual, a11y, etc.) or the validation pipeline | `04-engine-specifications-and-pipeline.md` |
| Database schema, tables, relationships, storage strategy | `05-database-and-api.md` |
| REST endpoints, request/response shape, auth, error codes | `05-database-and-api.md` |
| How/when AI is allowed to be involved | `06-ai-architecture.md` |
| Accuracy targets, benchmark process, release gating | `07-accuracy-benchmark.md` |
| Which library/framework to use for X | `08-technology-stack.md` |
| Dashboard layout, UX rules, screens, empty/error/loading states | `09-dashboard-ux.md` |
| Repo structure, branching, PR review, testing strategy | `10-development-guidelines.md` |
| Environments, infra, CI/CD, secrets, monitoring, rollback | `11-deployment-architecture.md` |

## Document list

1. `01-product-vision-and-principles.md` — merges README + Product Principles + Problem Analysis
2. `02-personas-and-roadmap.md` — merges User Personas & Journey + Product Scope & Roadmap
3. `03-system-and-engine-architecture.md` — merges System Architecture + Core Engine Framework
4. `04-engine-specifications-and-pipeline.md` — merges Engine Specifications + Technical Architecture & Validation Strategy
5. `05-database-and-api.md` — merges Database Architecture + API Architecture
6. `06-ai-architecture.md`
7. `07-accuracy-benchmark.md`
8. `08-technology-stack.md`
9. `09-dashboard-ux.md`
10. `10-development-guidelines.md` — **drafted default**, no original source doc existed
11. `11-deployment-architecture.md` — **drafted default**, no original source doc existed

## Source mapping (original 15 docs → new location)

| Original file | Consolidated into |
|---|---|
| 00_README.md | 01 |
| 01_PRODUCT_PRINCIPLES.md | 01 |
| 02_PROBLEM_ANALYSIS.md | 01 |
| 03_PRODUCT_SCOPE_AND_ROADMAP.md | 02 |
| 04_USER_PERSONAS_AND_USER_JOURNEY.md | 02 |
| 05_SYSTEM_ARCHITECTURE.md | 03 |
| 09_CORE_ENGINE_FRAMEWORK.md | 03 |
| 14_ENGINE_SPECIFICATIONS.md | 04 |
| 10_TECHNICAL_ARCHITECTURE_AND_VALIDATION_STRATEGY.md | 04 |
| 12_DATABASE_ARCHITECTURE.md | 05 |
| 13_API_ARCHITECTURE.md | 05 |
| 15_AI_ARCHITECTURE.md | 06 |
| 11_ACCURACY_BENCHMARK_AND_VALIDATION_FRAMEWORK.md | 07 |
| 06_TECHNOLOGY_STACK.md | 08 |
| 08_DASHBOARD_AND_USER_EXPERIENCE.md | 09 |

**Docs 10 and 11 have no original source** — the README's planned doc list (00–22) referenced
`20_DEVELOPMENT_GUIDELINES.md` and `19_DEPLOYMENT_ARCHITECTURE.md`, but they were never written.
Docs 10–11 here are drafted defaults filling that gap; revise them as real team practice forms.
`16_REPORTING_ARCHITECTURE`, `17_SECURITY_AND_PERMISSIONS`, `18_PERFORMANCE_ARCHITECTURE`,
`21_PRODUCT_ROADMAP`, and `22_GLOSSARY` remain undrafted — partially covered already by docs
04/07/09/02 respectively, but not as standalone documents.
