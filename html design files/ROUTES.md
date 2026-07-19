# TenTwenty QA Studio — Route & File Manifest

This is the functional prototype, split into files so it maps cleanly onto a
Next.js app. Everything here is currently a client-rendered vanilla JS SPA
(one `index.html`, classic scripts, a global `STATE` object, string-template
rendering into `#content`). Nothing here is Next.js code yet — this is the
reference to build Next.js *from*.

## Suggested route mapping

| File | Suggested Next.js route | Notes |
|---|---|---|
| `shared/auth.js` (`loginForm`, `signupForm`) | `/login`, `/signup` | Split into two pages. Signup sets an "empty state" flag — see Dashboard notes. |
| `pages/dashboard.js` | `/dashboard` | Reads project status, running audits, findings, recent runs. Has two states: populated and first-run empty state (`STATE.newAccount`). |
| `pages/projects.js` (`screenProjects`) | `/projects` | List view. |
| `pages/projects.js` (`screenProject` + `projectTab*`) | `/projects/[projectId]` with tabs `?tab=overview\|knowledge\|environments\|testing\|reports\|history\|settings` | One layout, 7 tab components. **Knowledge tab is the requirements/test-case upload feature** — treat `KNOWLEDGE_SOURCES` as real uploaded documents in production. |
| `pages/audit.js` | `/audits/new` (config), `/audits/[runId]/live`, `/audits/[runId]/summary` | Live Audit currently fakes progress at a fixed 72% — needs a real progress/event source. |
| `pages/findings.js` | `/findings` (or `/projects/[projectId]/findings`) | Split list/detail view. Includes bulk actions (accept/reject/ignore/export/delete) and an evidence viewer with tabs (Screenshot/DOM/HTML/CSS/Console) — currently static placeholder content per tab, needs real evidence data. |
| `pages/reports.js` | `/reports` | Three report types as tabs (Developer/Management/Executive). |
| `pages/history.js` | `/history` (also reused inside project Testing/History tab) | Simple table. |
| `pages/settings.js` | `/settings` | User + AI provider + engine settings. |
| `pages/admin.js` | `/admin` | User management table with role/status. |
| `shared/modals.js` | Shared modal components | Create Project (4-step wizard), Add Environment, Upload Knowledge Source, Invite User, Connect Figma, generic Confirm dialog. These are the actions that need real backend calls. |
| `shared/app-shell.js` | `<AppShell>` / `<Layout>` | Sidebar nav, header, profile menu, persistent "audit running" indicator, skeleton-loading + fade transition on navigation. |
| `shared/toast.js` | Toast/notification provider | Currently a simple DOM-append queue; swap for whatever toast library you use, or keep the pattern. |
| `shared/state.js` | Global app state → replace with real state management | `STATE` currently holds everything (current project, selected finding, modal open/closed flags, etc.) in one object mutated directly. In Next.js this splits into: server data (via fetch/RSC), URL state (selected tab, selected finding id — put these in the URL), and local UI state (modal open/closed — `useState`). |

## Data that needs a real backend

Everything below is hardcoded sample data in the relevant `pages/*.js` file and needs to become real API calls:

- `KNOWLEDGE_SOURCES` (`pages/projects.js`) — uploaded requirements/test cases/content sheets/Figma files
- `ENVIRONMENTS` (`pages/projects.js`) — per-project environments (Dev/QA/Staging/Production)
- `FINDINGS` (`pages/findings.js`) — audit findings
- `ADMIN_USERS` (`pages/admin.js`) — org members
- Dashboard's stats, running audits, recent runs — all inline sample data in `pages/dashboard.js`

## Design tokens

`styles/tokens.css` is the full color/spacing/radius token set — port this directly to a Tailwind theme config or CSS variables file, whichever this project uses. `styles/base.css` and `styles/components.css` are the type ramp and component styles; each CSS class maps to a component (see README.md for the full mapping table).

## What's intentionally still a prototype

- Live Audit progress is hardcoded at 72%, not driven by real events
- Evidence viewer tabs show static placeholder content, not real screenshots/DOM/logs
- "Connect Figma" doesn't actually call the Figma API
- No real authentication — Login/Signup just navigate straight into the app
