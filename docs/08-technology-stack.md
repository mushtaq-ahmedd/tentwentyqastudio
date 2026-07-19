# 08 — Technology Stack

## Selection Philosophy

Every technology must solve a real engineering problem and improve at least one of: accuracy,
speed, reliability, maintainability, developer productivity. Popularity alone is never a
justification.

## Stack At A Glance

| Layer | Technology |
|---|---|
| Frontend | Next.js + TypeScript |
| UI Components | shadcn/ui |
| Styling | Tailwind CSS |
| Backend API | Fastify (Next.js API routes acceptable for MVP) |
| Browser Automation | Playwright |
| Database | PostgreSQL |
| ORM | Prisma |
| Object Storage | Supabase Storage / S3 |
| Queue | BullMQ |
| Cache | Redis |
| Image Processing | OpenCV |
| Image Difference | Pixelmatch |
| Design Integration | Figma REST API |
| Accessibility | axe-core |
| Performance | Lighthouse |
| Security | OWASP ZAP (future) |
| AI Providers | OpenAI / Claude / Gemini |
| Logging | Pino |
| Monitoring | Sentry |
| Containerization | Docker |

## Notes Per Layer

- **Frontend logic boundary:** the frontend contains presentation logic only. Business logic
  belongs in backend services.
- **TypeScript everywhere** — frontend and backend both, for type safety, shared interfaces,
  refactor safety, and better Claude Code generation quality.
- **Playwright's job is collection only** (see doc 04) — open browser, authenticate, navigate,
  capture screenshots/DOM/CSS/console/network/accessibility tree. It never decides whether
  something is a bug.
- **Figma REST API** data (frames, components, typography, colors, layout) must be cached — never
  re-fetched redundantly.
- **Pixelmatch** identifies changed regions/percentage/highlights only — it does not decide
  pass/fail; that's downstream in the Visual/Confidence Engines.
- **OpenCV** adds layout analysis, region/edge detection, contours, alignment, bounding boxes,
  structural similarity — improves visual accuracy beyond raw pixel diff.
- **Element Matching** is custom tentwenty QA Studio technology (not a third-party library) — matches Figma
  components to website elements by text, position, size, parent, component type, accessibility
  role, visual similarity. Treat this as one of the most important systems in the platform.
- **Redis** responsibilities: queue backing, sessions, Figma cache, temporary results, active
  audit state.
- **BullMQ** turns long operations into background jobs: large audits, report generation,
  screenshot processing, AI processing. Every page audit should be its own queue job.
- **Browser support V1:** Chrome only. Future: Edge, Firefox, Safari.
- **OS support:** development on Windows/macOS/Linux; production on Linux.

## Technologies Intentionally Avoided (V1)

Selenium, Cypress, Puppeteer, Electron, heavy UI frameworks, multiple ORMs, multiple CSS
frameworks. Keeping the stack focused reduces long-term maintenance complexity — don't introduce
these without a documented, evidence-based reason.

## Technology Decision Matrix

Before adopting any new technology, answer:
1. Does it improve deterministic validation?
2. Does it improve accuracy?
3. Does it improve execution speed?
4. Is it production-ready?
5. Does it simplify the architecture?
6. Will it remain maintainable for years?

If most answers are "no," don't adopt it. Replacing an existing technology must always be
evidence-based, not preference-based.

## Definition of Excellence — Stack

Every technology has a clear purpose; no unnecessary dependencies exist; the stack supports
deterministic validation; the platform stays fast and maintainable; future technologies can be
introduced without major redesign; Claude Code can generate high-quality, maintainable
implementations against this stack.
