# 02 — Personas, User Journey & Roadmap

## Users

tentwenty QA Studio has **one primary user** and **four secondary consumers of the same findings** (not
separate products — filtered views of one underlying dataset).

| User | Role | Primary goal | Needs |
|---|---|---|---|
| **QA Engineer** (primary) | Validates builds, compares vs. design/content, runs regression, verifies functionality, reports defects | Validate quality quickly | Audit starts <30s; findings within 1 min; evidence reviewable fast; report exportable immediately |
| QA Lead | Reviews release quality, monitors QA progress, manages projects | Monitor testing progress | Audit status, critical findings, team productivity, release confidence, historical trends |
| Engineering Manager | Monitors engineering quality, release health, project risk | Understand release health | High-level only: finding counts, critical issues, release readiness, audit duration, team activity — no implementation detail |
| Developer | Fixes reported issues | Fix issues efficiently | Clear findings, accurate evidence, screenshots, expected/actual result, suggested resolution — should never need to ask QA for clarification |
| Product Manager | Understands overall release quality | Understand release readiness | Executive summary, major risks, release recommendation, overall progress — no technical detail |

## Success Criteria for the Primary User

A QA Engineer should be able to: start an audit in under 30 seconds, receive first findings
within the first minute, review evidence quickly, export a report immediately, and begin
exploratory testing sooner than today's workflow allows.

## Current vs. Future Workflow

**Today (pain-heavy):**
```
Receive Build → Understand Scope → Open Figma → Open Website → Compare Every Screen →
Compare Components → Compare Content → Check Typography/Colors/Buttons/Nav/Links →
Test Forms → Capture Screenshots → Write Bug Reports → Prepare Report → Submit → Repeat
```
Pain characteristics: slow, repetitive, error-prone, manual, inconsistent.

**With tentwenty QA Studio:**
```
Receive Build → Open tentwenty QA Studio → Select Project → Select Environment →
Choose Validation Types → Run Audit → Review Findings → Export Report →
Begin Exploratory Testing → Release
```

## Key Workflows (for UX/engineering reference)

- **New project setup** (one-time, reused every audit): Create Project → Add Environments →
  Configure Authentication → Connect Figma → Upload Content Sheet (optional) → Ready.
- **Audit workflow**: Select Project → Select Environment → Select Testing Types → Run Audit →
  Monitor Progress → Review Findings → Generate Report → Complete. Users never touch low-level
  engine settings during a normal audit.
- **Findings workflow**: Open Findings → Filter → Review Evidence → Verify → Export → Share with
  Developers.
- **Release workflow**: Run Final Audit → Review Critical Findings → Generate Executive Report →
  Approve Release → Deploy.

A first-time user should be able to create a project, configure an environment, run an audit,
review findings, and export a report **without external training** — the interface must be
self-explanatory.

## Product Strategy

Incremental delivery. Every version must provide immediate, measurable value. Accuracy is always
prioritized over additional features.

## Version 1 — "Reliable deterministic QA assistant"

**Objective:** eliminate the most repetitive manual validation tasks. Solve real engineering
pain, not showcase AI.

**In scope:**
- Project management (create/edit/archive, multiple environments)
- Environment management (Dev/QA/UAT/Staging/Production — each stores base URL, credentials,
  browser settings, validation config)
- **UI Validation**: layout, typography, color, component, image, icon comparison; visibility,
  position, spacing validation
- **Figma comparison**: connect Figma, import design, parse components, compare frames/elements,
  cache design data
- **Content Validation** — two modes: (1) Content Sheet → Website comparison, (2) Website-only
  grammar/readability/broken-content/placeholder detection (no content sheet required)
- **Functional Validation**: navigation, buttons, links, forms, search, upload, download,
  pagination, filters, authentication — deterministic only
- **Browser Validation**: console errors, network errors, failed requests, broken resources,
  missing images
- **Evidence Collection**: screenshots, highlighted screenshots, DOM, CSS, HTML, console logs,
  network logs — every finding must include evidence
- **AI Reporting**: bug title, description, business impact, suggested resolution, executive
  summary — AI never determines pass/fail
- **Reports**: Developer Report, Management Report, Executive Summary; PDF, CSV
- **Dashboard**: projects, recent audits, reports, findings, engine status, history

**V1 succeeds when:** UI validation is trusted; content validation is trusted; reports require
minimal editing; findings include evidence; false positives stay minimal; engineers use tentwenty QA Studio
daily.

## Version 2 — "Advanced validation platform"

Expands deterministic capability — still no autonomous AI judgement:

- **Accessibility Validation** (axe-core)
- **Performance Validation** (Google Lighthouse)
- **Responsive Validation** (desktop/tablet/mobile)
- **API Validation** (REST + GraphQL — status codes, response schema, response time, contract
  validation)
- **Workflow Validation** (multi-step: login, registration, checkout, booking, payment)
- **Knowledge Base** — projects gain understanding via requirements, test cases, documentation,
  improving reporting and future AI reasoning
- **Release Readiness Score** — overall release confidence based on findings

## Version 3 — "Complete Quality Engineering Platform"

- Security Validation (OWASP ZAP)
- Mobile Application Validation (Android/iOS)
- Cross-Browser Validation (Chrome/Firefox/Safari/Edge)
- Visual Regression History + Regression Heatmap
- AI Release Intelligence (release summary, risk analysis, change impact)
- CI/CD Integration (GitHub, GitLab, Azure DevOps, Jenkins)
- Notifications (Slack, Teams, Email)
- Plugin Marketplace (third-party engines)

**Future research (not committed, doesn't gate V1):** AI-assisted exploratory testing, natural
language test generation, self-healing workflows, component intelligence, design drift analysis,
mobile visual comparison, API intelligence, local AI models.

## Explicitly Out of Scope for V1 — do not build these early

Mobile testing, cross-browser testing, performance engineering, security scanning, API
automation, CI/CD integration, Jira/Azure DevOps/Slack/email integrations, plugin marketplace,
**AI-generated test cases**, **autonomous exploratory testing**. These are fenced off by name —
building them prematurely violates the roadmap even if technically easy.

## Product Boundaries

tentwenty QA Studio is not trying to replace Jira, Azure DevOps, TestRail, Selenium, Playwright, BrowserStack,
Postman, Lighthouse, or OWASP ZAP. It **orchestrates and enhances** these tools rather than
competing with them.

## Engineering Priorities (never reverse this order)

1. Accuracy, Confidence, Evidence
2. Speed, Performance, Parallel Execution
3. User Experience, Reporting, Dashboard
4. AI Enhancements

## UX-Level Success Metrics

QA Engineers use it every release; engineers trust findings without repeated manual
verification; manual comparison work decreases significantly; report prep time decreases;
exploratory testing time increases; release confidence improves.
