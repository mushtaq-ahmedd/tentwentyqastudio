# 05 — Database & API Architecture

## Database Design Principles

- Normalize core data.
- Use **UUIDs** as primary keys.
- Enforce foreign keys.
- Index frequently queried fields.
- Store evidence **outside** the database (object storage), never as blobs in PostgreSQL.
- Audit data is **immutable after completion** — only report generation or annotations may touch
  it later.

## Core Entity Chain

```
Users → Projects → Environments → Audits → Pages → Findings → Evidence → Reports
```

## Main Tables

| Table | Purpose |
|---|---|
| `users` | User accounts |
| `projects` | QA projects (name, description, base URL, Figma file, status, created by). Also carries `figma_access_token` (Phase B addition — needed to actually call the Figma REST API; plain string, same no-real-encryption gap as `environments.encrypted_creds`) |
| `figma_file_cache` | Figma Engine's cache (Phase B addition, docs/03/04's "never re-download the same design repeatedly" rule) — one row per project/file, storing Figma's last-modified timestamp and the extracted frame/component structure, not the raw file |
| `environments` | Dev/QA/UAT/Staging/Production per project (name, URL, browser config, auth settings) |
| `audits` | One execution of tentwenty QA Studio (project, environment, status, start/end time, duration) |
| `pages` | Pages validated within an audit (URL, page name, audit ID, validation status) |
| `findings` | Every issue detected (engine, severity, confidence, title, description, expected/actual result, status) — belongs to exactly one page and one audit |
| `evidence` | Screenshot/log metadata only — files live in object storage (finding ID, type, file path, created time) |
| `reports` | Generated reports (report type, generated time, file path, audit ID) |
| `engine_results` | Per-engine execution diagnostics (engine name, status, duration, findings count, error count) |
| `settings` | Platform configuration (AI provider, default browser, theme, feature flags) |

## Relationships

```
User └── Projects
Project └── Environments
Environment └── Audits
Audit ├── Pages ├── Findings ├── Reports └── Engine Results
Finding └── Evidence
```

## Storage Strategy

| Store | Contents |
|---|---|
| **PostgreSQL** | Structured data, relationships, metadata |
| **Object Storage** (Supabase Storage / S3) | Screenshots, reports, trace files, logs |

**Large files must never be stored directly in PostgreSQL.**

## Indexing

Index at minimum: Project ID, Audit ID, Page URL, Finding Severity, Finding Status, Created At —
these are the fields filtering/reporting queries hit most.

## Audit Immutability

Audit records are never modified after completion. Only report generation or annotation may
change data afterward — the underlying audit result itself is frozen.

## Scalability Targets

Multiple projects, concurrent audits, millions of findings, large evidence libraries, historical
reporting — schema decisions should not assume single-project or single-audit scale.

---

## API Design Principles

RESTful, versioned (`/api/v1/...`), stateless, JSON responses, consistent error handling, JWT
authentication.

> **Resolved decision (see docs/10 "Documentation Discipline"):** authentication is implemented via
> **Supabase Auth** rather than a hand-rolled JWT issuance/refresh flow. Supabase Auth still issues
> standard JWTs (satisfying "JWT authentication" above) and gives us user management, password
> reset, and session handling without custom code. The `/api/v1/auth/*` endpoints below are thin
> wrappers where useful (e.g. `me`, role lookup) — login/signup/refresh happen client-side via the
> Supabase client SDK, not a custom endpoint. Chosen over custom JWT because we're already on
> Supabase for Postgres + Storage, and it meaningfully reduces auth code we'd otherwise have to
> build and maintain ourselves.
>
> **Also resolved:** the API layer for this phase is **Next.js Route Handlers** (`apps/web/src/app/api/v1/...`),
> per doc08's explicit "Next.js API routes acceptable for MVP" allowance — not a separate Fastify
> service yet. Revisit this once/if the API needs to scale or be consumed independently of the
> frontend (e.g. by background workers in a different runtime).

## High-Level API Flow

```
Frontend → REST API → Core Services → PostgreSQL → Storage (Supabase/S3)
```

## Core Modules

Authentication, Users, Projects, Environments, Audits, Findings, Reports, Settings,
Administration.

## Key Endpoints (representative, not exhaustive)

> **Implementation status note:** the endpoints below are live as of the Phase A backend build
> (Next.js Route Handlers, per the resolved decision above). A few extensions beyond this
> original list were added where the frontend genuinely needed them — marked `(extension)`.
> `PUT /projects/{id}` and `PUT /environments/{id}` (full-record update) are **not yet
> implemented** — only create/read/delete exist today for those two resources.

```
GET    /api/v1/auth/me          # login/logout/refresh happen client-side via Supabase Auth SDK

GET    /api/v1/projects
POST   /api/v1/projects
GET    /api/v1/projects/{id}
DELETE /api/v1/projects/{id}
POST   /api/v1/projects/{id}/archive          # (extension) soft-archive, distinct from delete

GET    /api/v1/projects/{id}/environments
POST   /api/v1/projects/{id}/environments
DELETE /api/v1/environments/{id}

GET    /api/v1/projects/{id}/knowledge         # (extension)
POST   /api/v1/projects/{id}/knowledge         # (extension)
DELETE /api/v1/knowledge/{id}                  # (extension)

POST   /api/v1/audits/start
GET    /api/v1/audits
GET    /api/v1/audits/{id}
GET    /api/v1/audits/active                   # (extension) powers the header's live-audit pill
POST   /api/v1/audits/{id}/cancel

GET    /api/v1/findings
GET    /api/v1/findings/{id}
PATCH  /api/v1/findings/{id}      # supports filtering by severity, engine, status, audit, project
PATCH  /api/v1/findings/bulk                   # (extension) bulk status update
DELETE /api/v1/findings/bulk                   # (extension) bulk delete

GET    /api/v1/reports
GET    /api/v1/reports/{id}
GET    /api/v1/reports/{id}/download   # PDF, HTML, CSV — not yet implemented (no Report Engine yet)

GET    /api/v1/admin/users                     # (extension)
POST   /api/v1/admin/users                     # (extension) invite
PATCH  /api/v1/admin/users/{id}                # (extension) toggle active/disabled
DELETE /api/v1/admin/users/{id}                # (extension)

GET    /api/v1/dashboard/summary               # (extension) one aggregated call for the Dashboard

GET    /api/v1/settings
PUT    /api/v1/settings
```

An **audit start request** includes: Project ID, Environment, Validation Types, Configuration.

## Standard Response Envelope

**Success:**
```json
{
  "success": true,
  "data": {},
  "message": "Request completed successfully."
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "Project does not exist."
  }
}
```

No endpoint may deviate from this envelope shape.

## HTTP Status Codes

| Status | Usage |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request (failed validation) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## Authentication & Authorization

**Authentication:** Supabase Auth (issues standard JWT access + refresh tokens; see resolved
decision above). Session/token handling goes through `@supabase/ssr` on the server side so Route
Handlers can read the authenticated user from cookies.
**Authorization (roles):** Administrator, QA Lead, QA Engineer, Viewer — stored as a `role` column
on `users`, set via Supabase Auth's user metadata or a joined `profiles` table.
Role-based access control must be enforced on every protected endpoint.

## Input Validation

Every incoming request must be validated before processing: required fields, data types, URL
format, enum values, UUID format. Invalid requests return HTTP 400 — never silently coerce bad
input.

## API Versioning

All endpoints are versioned (`/api/v1/...`). Breaking changes require a **new** API version —
never break `v1` in place.

## Logging

Every request logs: Timestamp, User ID, Endpoint, Method, Response Status, Duration.
**Sensitive data must never be logged.**

## Security

Enforce HTTPS, validate JWTs, sanitize inputs, apply rate limiting, protect against common web
vulnerabilities (injection, XSS, CSRF, etc.).

## Definition of Success — API

Endpoints are consistent; authentication is secure; responses follow the standard format; errors
are predictable; the API remains backward compatible through versioning; new modules can be
added without breaking existing clients.
