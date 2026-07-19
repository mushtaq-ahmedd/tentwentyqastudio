# TenTwenty QA Studio — Design & Prototype Handoff

This is the full interactive prototype, split into files for development handoff.
Open `index.html` directly in a browser to run it (double-click, or open via
Chrome → File → Open File) — no build step needed, it's plain HTML/CSS/JS.

**Start with `ROUTES.md`** — it maps every file here to a suggested Next.js
route/component and flags exactly which parts are sample data vs. real UI.

## Structure

```
tentwenty-qa-studio/
├── index.html              ← open this to run the prototype
├── ROUTES.md                ← file → Next.js route mapping (read this first)
├── styles/
│   ├── tokens.css           ← design tokens (colors, spacing, radius) — source of truth
│   ├── base.css              ← reset + type ramp
│   └── components.css        ← every reusable component style (buttons, cards, tables, modals, etc.)
├── shared/
│   ├── icons.js               ← inline SVG icon set
│   ├── nav-config.js          ← sidebar navigation config
│   ├── state.js               ← global app state object
│   ├── toast.js               ← toast notification system
│   ├── auth.js                ← Login / Sign Up screens
│   ├── app-shell.js            ← sidebar, header, profile menu, live-audit indicator, page transitions
│   └── modals.js               ← every modal: Create Project, Add Environment, Upload Knowledge Source, Invite User, Connect Figma, generic Confirm dialog
└── pages/
    ├── dashboard.js
    ├── projects.js            ← Projects list + full Project Workspace (Overview/Knowledge/Environments/Testing/Reports/History/Settings tabs)
    ├── audit.js                ← Run Audit config, Live Audit, Audit Summary
    ├── findings.js             ← Findings list/detail, bulk actions, evidence viewer
    ├── reports.js
    ├── history.js
    ├── settings.js
    └── admin.js
```

## Design signature (keep this consistent going forward)

- **Two-typeface pairing**: Inter for UI text, monospace (IBM Plex Mono) for anything numeric or machine-verified — run IDs, percentages, counts, durations, confidence scores.
- **Single accent color** (deep teal), used sparingly for primary actions, active nav state, and links. Status colors (success/warning/error/info) are kept separate from the accent.
- **Severity accent bars** next to badges on finding rows, not just color-coded pills.
- **Minimal shadows** — only two elevation levels exist on purpose (`--shadow-subtle`, `--shadow-medium`).
- **Skeleton loading + fade-in** on every navigation — don't drop this when porting to Next.js; use route loading states / Suspense boundaries to preserve the same feel.

## Status

All core screens are built and interactive: auth (login/signup with empty-state
onboarding), dashboard, projects list + full project workspace (including the
Knowledge module for requirements/test-case uploads), the full audit run flow,
findings with bulk actions and an evidence viewer, reports, run history,
settings, and administration — plus every modal and confirmation dialog needed
to support them.

See `ROUTES.md` for what's still sample data vs. what needs a real backend.
