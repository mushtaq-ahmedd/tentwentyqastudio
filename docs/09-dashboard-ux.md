# 09 — Dashboard & User Experience

## Design Philosophy

Minimal, fast, functional, professional. The dashboard should feel like an engineering tool, not
an admin panel. Every component must have a purpose; prioritize productivity over decoration.
Design inspiration: Linear, GitHub, Vercel, Notion — for simplicity, clarity, and information
hierarchy, not visual mimicry.

## What the Dashboard Must Answer Immediately

What should I work on? What is currently running? What failed? What requires attention? How
quickly can I start my next audit?

## Core UX Rules

- **Fewer clicks**: the most common workflow (running an audit) must take ≤ 3 clicks.
- **Progressive disclosure**: only show what's needed now; advanced config stays hidden until
  requested.
- **Immediate feedback**: every action shows its state (Running, Completed, Failed, Waiting,
  Queued) — users should never wonder if the platform is working.
- **Consistency**: buttons, tables, dialogs, cards, drawers, forms, and navigation behave
  identically everywhere in the app.
- **Performance-first**: never block the UI; show continuous progress on long operations.

## Global Layout

```
┌──────────────────────────────────────────────────────────────┐
│ Header                                                        │
├──────────────┬───────────────────────────────────────────────┤
│ Sidebar      │                                                │
│ (fixed)      │           Main Workspace                       │
│              │                                                │
├──────────────┴───────────────────────────────────────────────┤
│ Footer                                                         │
└──────────────────────────────────────────────────────────────┘
```

**Desktop-first. Mobile/tablet are intentionally not supported in V1.** Target resolution
1440px+, minimum supported width 1280px.

**Header:** current project, current environment, running-audit indicator, user profile — keep
minimal.

**Sidebar (fixed, primary nav):** Dashboard, Projects, Audit Center, Findings, Reports, History,
Settings, Administration.

## Dashboard Homepage Sections

Recent Projects, Running Audits, Recent Findings, Recent Reports, Engine Health, Recent Activity,
Quick Actions (New Project / Run Audit / Open Latest Report / Review Latest Findings — always
visible, never hidden).

| Section | Displays |
|---|---|
| Recent Projects | Name, Environment, Last Audit, Status, Last Updated, [Open / Run Audit] |
| Running Audits | Project, Environment, Progress, Current Engine, Est. Remaining Time |
| Recent Findings | Severity, Title, Project, Confidence (click → Findings module) |
| Recent Reports | Report Name, Generated Time, Project, Type, [View / Download] |
| Engine Health | Healthy / Running / Waiting / Failed per engine |
| Recent Activity | Timeline: Audit Started, Audit Completed, Report Generated, Project Created |

## Projects Screen

Each project card: Name, Environment Count, Last Audit, Last Report, Total Findings, Status.
A project's detail view contains: Overview, Environments, Configuration, Audit History,
Findings, Reports — the project is the central workspace.

**Project configuration stores:** General (name, description), Environment (URL, credentials,
browser), Design (Figma), Validation (enabled engines, ignore rules), Reporting (report
template).

## Audit Center (the most important workflow — must feel effortless)

```
Select Project → Select Environment → Select Validation Types → Run Audit
```
No unnecessary configuration. Validation selection is **business-capability language** (UI
Validation, Figma Comparison, Content Validation, Grammar Validation, Functional Validation) —
never technical implementation names.

**Live Audit view:** overall progress, current engine, current page, current activity, and
**live findings that appear immediately — never wait for the audit to finish before showing
value.**

## Findings Experience

Primary working area after an audit. Every finding row shows: Severity, Confidence, Engine,
Screenshot, Title, Status. Selecting a finding opens full detail.

## Report Experience

Should read like professional engineering documentation: Executive Summary, Statistics,
Findings, Evidence, Recommendations. **Reports should require almost no editing before sharing.**

## History

Every audit is stored and reopenable: Date, Project, Duration, Findings, Report.

## Settings (intentionally simple)

Categories only: General, AI, Engines, Preferences. Advanced configuration stays hidden from the
main settings surface.

## Administration (V1 scope: nothing more than this)

Users, Roles, Permissions.

## Empty / Loading / Error States

- **Empty states** must explain: what this page is, why it exists, what to do next (e.g. "No
  audits yet. Run your first audit to begin validating your project.").
- **Loading states**: skeleton loaders, never blank pages; long operations show progress.
- **Error states** must answer: what happened, why, how to recover. **Never expose raw stack
  traces to the user.**

## Accessibility (of tentwenty QA Studio's own UI)

Keyboard navigation, visible focus states, ARIA labels, high contrast support, screen reader
compatibility — built into every component, not bolted on afterward.

## Dashboard KPIs (meaningful only — avoid vanity metrics)

Total Projects, Running Audits, Completed Audits, Critical Findings, Time Saved, Average
Confidence, Average Audit Duration, Engine Accuracy.

## Definition of Excellence — Dashboard/UX

A new QA Engineer can use the platform without training; the primary workflow takes fewer than
three clicks; audits start within 30 seconds; findings appear while the audit is still running;
reports are accessible immediately after completion; navigation stays intuitive as the platform
grows; every screen feels consistent.
