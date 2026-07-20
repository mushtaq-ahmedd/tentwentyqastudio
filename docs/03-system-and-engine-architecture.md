# 03 — System & Engine Architecture

> **Implementation status (Phase B):** `packages/core` implements the Orchestrator and standard
> Engine interface described below exactly as written, plus one addition not yet in this doc: the
> `Engine` interface carries a `scope: "audit" | "page"` field. Audit-scoped engines (Discovery)
> run once; page-scoped engines (Browser, Content) run once per discovered page, sequentially —
> `packages/core/src/orchestrator.ts`'s `runPageScopedEngine`. A single page's failure only counts
> against that engine's `errorCount`; it doesn't fail the other pages or the audit (verified live:
> a real crawl of lipsum.com hit two downloadable-file links the Browser Engine correctly couldn't
> navigate to — the audit still completed the other 3 pages).
>
> Interim simplifications, flagged per docs/10's discipline rather than silently deviating:
> - **No BullMQ/Redis yet** — the Orchestrator runs engines in-process, synchronously within the
>   `startAudit` Server Action, not as queued background jobs. A real audit against ~20 pages
>   takes on the order of minutes (each page relaunches its own Chromium instance — see the
>   Browser Engine README); revisit once that latency is a real problem for users, not just a
>   known cost.
> - **Engine Registry is in-memory, single-process** (`packages/core/src/registry.ts`) — correct
>   for one Next.js process, but a real multi-worker deployment needs a shared registry instead.
> - **Pages execute sequentially within a page-scoped engine, not in parallel** — same in-process
>   constraint as above; real per-page parallelism needs the job queue.
>
> Engines that exist so far: **Discovery** (`discovery-engine`, audit-scoped, real crawl — also
> records same-origin broken links it observes as a side effect of crawling, into
> `sharedResources.brokenLinks`, with evidence text already uploaded), **Browser**
> (`browser-engine`, page-scoped, real Playwright — screenshot/DOM/console/network, uploaded to
> Supabase Storage), **Content** (`content-engine`, page-scoped, Mode 2 only — deterministic
> placeholder/empty-heading/missing-title checks against the Browser Engine's DOM snapshot;
> verified live against lipsum.com's real Lorem Ipsum content), **Functional**
> (`functional-engine`, page-scoped, broken-link findings only — the one check in docs/04's
> Functional Engine list achievable without actually driving the page; verified live with a real
> 404 link against a local fixture server), **Figma** (`figma-engine`, audit-scoped, real Figma
> REST API — downloads/caches a project's connected file via `Project.figmaFileUrl`/
> `figmaAccessToken`, extracts top-level frames/components into `sharedResources.figmaFrames` for
> the not-yet-built Element Matching Engine to consume later. The real "Connect Figma" flow
> (file URL + personal access token, verified against Figma's API before saving) replaces the
> earlier hardcoded UI stub. Only the failure path is live-verified so far — a bad token is
> genuinely rejected by Figma's API and nothing gets persisted; the success path (real frame
> extraction + `FigmaFileCache` reuse) is built and typechecked but not yet run against a real
> Figma file, since that needs a real personal access token no one has supplied yet). Every other
> Engine's `EngineResult` row is created at audit-start and stays `WAITING` — the Orchestrator
> deliberately leaves the audit honestly `RUNNING` rather than faking a `COMPLETED` pipeline that
> didn't actually validate anything.
>
> **Element Matching** (`element-matching-engine`) also exists now — docs/08 calls this "one of
> the most important systems in the platform," and this first slice implements exactly one of its
> six documented matching signals (text — a Levenshtein similarity ratio), not all of them.
> Position/size need Figma-frame-space-to-viewport-space coordinate reconciliation that isn't
> built; component-type/accessibility-role need a real Figma-type-to-DOM-tag mapping that isn't
> built; visual similarity needs the Visual Engine's image-diffing tech, which doesn't exist yet
> either. All three are real gaps, sequenced for later, not corners cut silently — see the
> engine's README. It isn't a user-selectable `ValidationType`; it rides along whenever `Figma
> Comparison` is selected, same treatment as Discovery/Browser always running. Its matching
> *algorithm* is verified against synthetic fixtures
> (`packages/engines/element-matching-engine/src/matching.verify.ts`, run manually — no test
> runner is wired up in this repo yet); the full engine against a real Figma file/rendered page is
> not, for the same reason the Figma Engine's success path isn't (needs a real Figma personal
> access token, not supplied yet).
>
> **UI Validation** (`ui-validation-engine`) also exists now — its first slice validates exactly
> what Element Matching's text-only signal can honestly support: a Figma text element with no
> live match ("Missing Design Element") and a matched element whose text isn't a near-perfect
> match ("Design/Live Text Mismatch"). Layout/position/spacing/component-type checks (the rest of
> docs/04's UI Validation list) aren't implemented — they need Element Matching to carry
> position/size/type data forward first, which it doesn't yet. Selecting `UI Validation` now also
> pulls in `FIGMA`/`ELEMENT_MATCHING` automatically (`audits.ts`), since UI Validation has nothing
> to compare against without them — same treatment `Figma Comparison` alone already had. Not
> live-verified for the same reason as Figma/Element Matching (no real Figma personal access token
> supplied yet).
>
> **Confidence** (`confidence-engine`) also exists now — the first Processing-category engine
> (docs/03 "no single Engine decides the final confidence"). Unconditionally included on every
> audit, it re-scores every Finding after Validation engines run, blending in two signals no
> single Validation engine can see on its own: evidence completeness (2+ evidence items, +0.02)
> and cross-audit recurrence (same project/engine/category seen in an earlier audit, +0.03),
> capped at 0.99. Boost-only by design — see its README for why a penalty signal isn't attempted
> yet. **Live-verified**, unlike the three engines above it: running a second real audit against
> the same lipsum.com environment showed the exact predicted math — Content Engine's 0.97
> baseline confidence became 0.99 (both bonuses fired, capped) on the recurrence of the same
> "Placeholder Content" category finding.
>
> **Visual** (`visual-engine`) also exists now — unconditionally included on every audit like
> Discovery/Browser/Confidence/Report. Implements docs/04's Visual Engine literally (Pixelmatch,
> "Reference Screenshot → Current Screenshot → Pixel Comparison"), with the Reference Screenshot
> being the most recent *prior audit's* screenshot of the same page (a new `PageScreenshot` table,
> written unconditionally by the Browser Engine, independent of whether any Finding ever
> references a given screenshot as Evidence) — audit-over-audit regression, not a Figma-baseline
> comparison. Confidence is deliberately capped at 0.75 (Medium) rather than higher, because
> docs/04's Visual Engine rule ("must respect Ignore Rules and Approved Differences... not a raw
> pixel diff with no context") isn't honored yet — neither mechanism exists in the schema. Fully
> live-verified without any Figma dependency: two real audits of an unchanged page produced zero
> findings; two real audits of a page with a deliberate, real content change (added, then removed)
> produced one correctly-scoped "Visual Regression" finding with a real diff percentage and a real
> uploaded diff image (the first engine to produce `HIGHLIGHTED_SCREENSHOT` evidence). See the
> engine's README for a flagged naming overlap with "Visual Regression" listed among *future*
> engines in this doc's own Scalability Rule section, below.
>
> **Functional** (`functional-engine`) was extended (v0.2.0) beyond broken links to also cover
> docs/02's V1-scope "Browser Validation" item (console errors, network errors, failed requests,
> broken resources, missing images) — there's no separate `EngineName` slot for it, and it's the
> same "judge data Browser Engine already collected" pattern as broken links, so it's folded in
> here rather than invented as a new engine. Three new checks, all reusing data Browser Engine was
> already capturing: Console Error (any `console.error`/uncaught exception during page load),
> Missing Image (a failed request whose URL looks like an image), Broken Resource (any other
> failed request — script/stylesheet/font/XHR). Live-verified against a real fixture page with a
> deliberate console error, a missing image, and a missing script: all three fired correctly,
> plus a bonus finding — Chromium itself logs resource-load failures to the console, so the
> Console Error check picked up those too, not just the explicit one (a real, welcome signal, not
> a bug).
>
> **Browser Engine also now extracts computed CSS** (docs/04 Browser Engine responsibility,
> previously ungathered) — a curated 6-property summary (`color`, `backgroundColor`,
> `fontFamily`, `fontSize`, `fontWeight`, `display`) per `domElements` entry, from
> `getComputedStyle()` inside the real rendered page (can't be derived from static HTML), uploaded
> as `CSS_SNAPSHOT` evidence. Closes the last gap in V1's Evidence Collection scope. Nothing
> consumes it yet — no engine does typography/color validation — collected ahead of that need,
> same as Figma Engine/Element Matching's data existing before UI Validation could fully use it.
> Live-verified: three real audits' worth of CSS snapshot files (25-41KB of real JSON each,
> correct mimetype) confirmed present in Storage, one per page.
>
> **AI** (`ai-engine`) also exists now — the first docs/06-governed engine. Generates a per-finding
> `aiExplanation` (new `Finding` column) and one per-audit `aiExecutiveSummary` (new `Audit`
> column), both purely additive — nothing about a finding's severity/confidence/other fields can
> be changed by this engine (docs/06: "the original finding is never altered by AI output").
> Provider-agnostic (`packages/core/src/ai/types.ts`'s `AIProvider` interface) with one real
> implementation so far (Anthropic Claude). `getConfiguredAIProvider()` reads which
> provider/model to use from the existing `platform_settings` table (docs/05 already documents
> this table as holding "AI provider" — built in Phase A; the resolver was corrected mid-build to
> read it rather than inventing a parallel env-var config) and only the secret API key
> (`ANTHROPIC_API_KEY`) from the environment, returning `null` if unconfigured. Surfaced a real,
> pre-existing gap while doing this: the Settings page displays `platform_settings` correctly but
> has no working save path (same class of bug as the already-tracked Project Settings one) — added
> to the deferred bug list. Unconditionally included on every audit, same as Discovery/Browser/
> Confidence/Visual/Report — degrading to "no AI content" is a valid, honest outcome (docs/06:
> "AI failure must never block report generation"), not a pipeline failure. Live-verified twice
> (before and after the resolver correction): the failure path (no API key) leaves every finding's
> `aiExplanation` and the audit's `aiExecutiveSummary` `null` while the engine still reports
> `COMPLETED` and nothing else is affected. The success path (a real Anthropic call) is not
> live-verified — same gap as the Figma Engine's success path, needs a real API key nobody has
> supplied yet.
>
> **Report** (`report-engine`) is the pipeline capstone — it's a Processing engine that depends on
> `ai-engine` and produces `Report` rows, not `Finding` rows (`validate()` returns `[]`). Generates
> four real files per audit: Developer Report (PDF, full findings detail with embedded
> screenshots), Management Report (PDF, stats + Critical/High findings only), Executive Summary
> (PDF, high-level + the AI executive summary text), and a Findings Export (CSV, flat data dump).
> PDFs are rendered via Playwright's `page.pdf()` against hand-written HTML/CSS — not Puppeteer,
> which docs/08 explicitly lists as "intentionally avoided" in V1; Playwright was already the
> sanctioned tool via the Browser Engine, so no new rendering dependency was introduced. Closed a
> real schema gap mid-build: the pre-existing `Report` model had a `type` (Developer/Management/
> Executive) but no way to distinguish "as PDF" from "as CSV" beyond guessing from the file
> extension, so a `ReportFormat` enum (`PDF`/`CSV`) and `Report.format` column were added. Reports
> are stored in their own private `reports` Supabase Storage bucket (`report-storage.ts`),
> deliberately separate from the per-finding `evidence` bucket — a report is a whole-audit document,
> not proof attached to a single finding. Unconditionally included on every audit, same as
> Discovery/Browser/Confidence/Visual/AI. **Fully live-verified**, unlike the Figma-chain and AI
> Engine success paths — Report Engine needs no external third-party credentials, so a real audit
> was run end-to-end and confirmed via direct DB/Storage inspection: all 4 `Report` rows created
> with correct type/format combinations and titles, all 4 files uploaded with real, substantial
> sizes and correct MIME types (the Developer PDF opened and inspected directly is a genuine
> single-page PDF 1.4 document with correct title metadata), and the project Reports page renders
> all 4 with working signed-URL Open/Download links.
>
> **Configuration Hierarchy** (Global -> Project -> Environment) is now real, not just declared.
> Previously `PlatformSettings` held four operational fields (`screenshotQuality`,
> `defaultTimeoutSeconds`, `retryCount`, `defaultViewport`) that nothing actually read — the
> Browser Engine hardcoded its own 15s navigation timeout and never set a viewport, and the
> Orchestrator's retry loop used a hardcoded `MAX_RETRIES = 2` — a real, silent gap surfaced while
> building this. `Project` and `Environment` gained the same four fields as nullable overrides
> (`packages/core/src/engine-config.ts`'s `resolveEngineConfig()` merges
> `environment ?? project ?? platform` per field, exactly matching this doc's stated precedence).
> The Orchestrator resolves this once per audit and puts it on `EngineContext.configuration
> .engineConfig`; the Browser Engine now actually uses it for navigation timeout and viewport, and
> the per-audit retry loop uses the resolved `retryCount` instead of a hardcoded constant.
> `screenshotQuality` is resolved through the full hierarchy but deliberately **not** applied to
> the canonical screenshot format — Playwright PNG screenshots have no lossy quality axis, and the
> Visual Engine's pixelmatch/pngjs comparison hard-depends on decoding that evidence as PNG;
> switching to JPEG for non-"High" settings would silently break cross-audit visual regression for
> any project/environment that isn't "High" (docs/03: no Engine's config may break another
> Engine). Flagged as a known gap rather than silently dropped. Settable today via the Add
> Environment modal's "Validation Config Overrides" section (Environment level only) or direct SQL
> (Project level — no UI yet, same class of gap as Platform/Project Settings' existing "real
> backend, no save UI" issue). **Live-verified** end-to-end against a real fixture server: an
> Environment-level override (`defaultTimeoutSeconds: 1`, `retryCount: 1`,
> `defaultViewport: "Mobile (375x667)"`) produced a screenshot that decoded to exactly 375x667
> pixels, and a deliberately slow page failed navigation with "Timeout 1000ms exceeded" logged on
> exactly 2 attempts (1 + 1 retry) — both matching the override, not the Global default. A second
> audit against an Environment with no override, on a Project with `defaultViewport: "Tablet
> (768x1024)"` set directly in Postgres, produced a 768x1024 screenshot — confirming the
> Environment -> Project -> Global fallback chain, not just a two-level override.
>
> **Content Validation Mode 1** ("Content Sheet -> Website comparison") is now implemented,
> completing the Content Engine (`content-engine` v0.2.0, previously Mode 2-only). docs/04/docs/02
> name this mode but specify no file format, column schema, or matching rule — a genuine spec gap.
> The invented contract: a CSV with `Page`/`Expected Text` required columns (`Element` optional),
> parsed once at upload time (`packages/core/src/content-sheet.ts`) and stored as structured JSON
> on `KnowledgeSource.parsedContent` — a new `KnowledgeSourceStatus.FAILED` value was added so a
> CSV with zero valid rows gets an honest terminal status (with the specific parse errors surfaced
> in the Knowledge page) instead of sitting at `PROCESSING` forever. The Orchestrator resolves the
> project's most recent `PROCESSED` Content Sheet once per audit onto
> `EngineContext.configuration.contentSheetRows`; the Content Engine matches each row's page (by
> URL path, not full origin — `matchesPagePath`) and scores every DOM element on that page against
> the row's `Expected Text` via a shared `textSimilarity` (Levenshtein ratio) — this function was
> moved from `element-matching-engine` into `packages/core` since both engines now need the same
> "how close is this text to that text" primitive, rather than maintaining two copies. Real file
> upload (and "paste as text") is now wired end-to-end for the `KnowledgeSource` "Content Sheets"
> type specifically — a new private `knowledge-sources` Supabase Storage bucket holds the raw CSV
> — while every other `KnowledgeSourceType` remains the pre-existing upload mock (deferred bug
> list; deliberately not fixed here, out of this feature's scope). **Live-verified** end-to-end: a
> real CSV (one exact-match row, one 45%-similar row, one row for text absent from the page) was
> uploaded through the real UI, parsed into 3 structured rows with `status: PROCESSED`, and a real
> audit against a fixture page produced exactly 2 findings — "Content Mismatch" (45% similarity,
> both expected/actual text quoted) and "Missing Expected Content" (nothing on the page came
> close) — with the exact-match row correctly producing zero findings, confirming matching content
> is never treated as evidence of a problem.
>
> **Browser Validation** (`browser-validation-engine`) is a new engine split out of the Functional
> Engine, correcting a real non-negotiable #4 violation ("one responsibility per Engine") from
> earlier in Phase B: Functional Engine had folded in console-error/missing-image/broken-resource
> checking because docs/03's `EngineName` enum had no dedicated slot for it — but docs/02 lists
> "Functional Validation" (navigation/buttons/links/forms) and "Browser Validation" (console
> errors/network errors/broken resources/missing images) as two **separate** V1 features, each
> deserving its own engine and its own user-facing checkbox. Added a real `BROWSER_VALIDATION`
> value to both the `EngineName` and `ValidationType` enums, gave it its own package
> (`browser-validation-engine`) and Audit Center checkbox, and trimmed `functional-engine` (now
> v0.3.0) down to broken-link checking only — its one genuinely implemented docs/04 check.
> Live-verified: a real audit selecting both checkboxes against a fixture page with one broken
> link, one console error, and one missing image produced exactly 1 "Broken Link" finding
> attributed to `FUNCTIONAL` and exactly 2 findings ("Console Error", "Missing Image") attributed
> to `BROWSER_VALIDATION` — confirming the two engines run and report completely independently,
> not just that the code compiles.
>
> **Background job queue (BullMQ + Redis) is now real**, closing the single most-repeated interim
> simplification flagged throughout this doc: audits used to run synchronously in-process inside
> the same web request that started them, blocking that request until every engine finished, with
> no way to survive a web-server restart mid-audit. `startAudit()` now creates the Audit row and
> calls `enqueueAudit()` (`packages/core/src/queue.ts`), returning immediately; a separate,
> long-running worker process (`apps/web/scripts/worker.ts`, run via `pnpm --filter web run
> worker`, one per docs/11's "Background Workers" box) consumes the queue and calls `runAudit()` —
> the orchestrator itself is unchanged, just no longer invoked inline from a request handler.
> Redis is Upstash-hosted (`REDIS_URL` in `.env.local`) rather than a local Docker Compose instance
> per docs/11's stated local-dev default — Docker wasn't available in this environment; the code
> is host-agnostic (any standard Redis connection string works). Job-level retries are capped at 2
> with a fixed backoff — not to retry an audit that failed on its own merits (the orchestrator's
> own top-level try/catch already marks those `FAILED` and resolves the job normally, so BullMQ
> never sees them as failed jobs), but as a safety net for the worker *process* itself crashing
> before that try/catch runs; re-invoking `runAudit()` is safe since it only re-processes engines
> still `WAITING`. **Live-verified**: ran a real audit through the actual UI with the worker
> process running separately from the Next.js dev server — the job was picked up in under a
> second, all 7 engines executed for real (not skipped), and the audit reached `COMPLETED`,
> confirmed via both the database and the worker's own structured log output
> (`audit-job-active`/`audit-job-completed` events).
>
> **The Visual Engine now gates on OpenCV structural similarity (SSIM) and region detection, not
> raw pixel-diff percentage.** Previously it flagged a finding whenever `pixelmatch`'s raw
> per-pixel color-difference count crossed a fixed percentage — a metric that treats sub-pixel
> anti-aliasing/font-rendering noise between two renders of an *unchanged* page exactly the same
> as a genuine content change, a real source of false-positive "visual regression" findings.
> `packages/engines/visual-engine/src/ssim.ts` implements windowed SSIM (Wang et al. 2004) via
> `@techstark/opencv-js` (a WASM OpenCV port, chosen over the native `opencv4nodejs` binding
> specifically because this environment has no Docker/system OpenCV install and no native build
> toolchain — WASM needs neither) and finds contiguous *regions* where local similarity drops
> below a cutoff (`GaussianBlur`+`threshold`+`findContours`+`boundingRect`), per docs/08's "region
> detection... bounding boxes." The engine gates on **region count**, not whole-page mean SSIM: a
> small localized change (one button, a line of text) is diluted by every unchanged surrounding
> pixel almost to the noise floor when averaged over a full page screenshot, so mean SSIM alone
> would miss exactly the small, real changes this feature exists to catch — region/contour
> detection is what preserves sensitivity while still filtering ambient render noise. Raw
> pixelmatch is retained only to render the human-reviewable highlighted diff evidence image, not
> to decide whether a finding exists. Confidence stays at 0.75 (unchanged) — SSIM fixed the
> anti-aliasing false-positive class specifically, not the separate, still-open "was this change
> intentional" ambiguity, so the confidence band doesn't move. **Live-verified** two ways: (1)
> `ssim.verify.ts`, a manual fixture script (no test runner exists in this repo — same pattern as
> `element-matching-engine`'s `matching.verify.ts`) confirming identical images score ~1.0 SSIM
> with zero regions, mild per-pixel rendering noise (±4/channel) scores >0.9 SSIM with zero
> false-positive regions, and a genuine 30×30 changed block is caught as exactly one region
> overlapping the actual changed area; (2) a real audit-over-audit run through the full pipeline
> and BullMQ worker against a live fixture page — a baseline audit, then a second audit after
> changing one button's color — produced exactly one "Visual Regression" finding, region
> `(623,313) 194x74px`, closely matching the button's actual on-screen position and size, with
> 99.6% overall SSIM (the change is a tiny fraction of the page) but still correctly flagged via
> region detection at 1.2% raw pixel difference.
>
> **The Content Engine's "Grammar Validation" now performs real grammar/spelling/readability
> checking**, closing a gap where it only ever checked placeholder text, empty headings, and
> missing page titles — genuinely unrelated to grammar despite the name. `grammar.ts` calls the
> public LanguageTool API (https://languagetool.org/, a real rule-based grammar/spell checker, not
> an LLM — each issue is a specific matched rule such as TYPOS/GRAMMAR/CONFUSED_WORDS, which is
> what keeps this "deterministic validation before AI," not a judgement call) rather than
> self-hosting a LanguageTool server, since that needs a Java runtime/Docker container unavailable
> in this environment — the same constraint that led to WASM OpenCV elsewhere in this doc. The
> public API is rate-limited and best-effort: a network failure or non-200 response is caught,
> logged, and treated as zero issues rather than failing the engine (docs/04 non-negotiable #7),
> the same failure-handling philosophy docs/06 requires for AI providers. `readability.ts`
> computes Flesch Reading Ease (Flesch, 1948) — a pure deterministic formula from sentence/word/
> syllable counts, no network dependency, so it always runs even when LanguageTool doesn't. Both
> checks run only over "flowing text" (`<p>`, `<li>`, `<blockquote>`, `<td>`, `<dd>` content, min
> 20 characters per block) rather than every leaf text node on the page — nav links, buttons, and
> short UI labels aren't sentences, and running a grammar/readability check over them produces
> mostly noise (a rule-based checker reads a UI fragment as a bad sentence even when it's normal
> copy), which would hurt precision (non-negotiable #3: fewer, trusted findings over noisy ones).
> The readability finding only fires below Flesch's own "Very Difficult" cutoff (30) and only once
> a page has at least 50 words of flowing text, keeping it rare rather than routine. **Live-
> verified** two ways: (1) `grammar.verify.ts` and `readability.verify.ts`, manual fixture scripts
> hitting the real public API and the real formula respectively (no mocking) — confirming a
> known-bad sentence ("This are a test...") is flagged with a correct suggested fix ("these"),
> a well-formed sentence produces zero issues, dense/jargon-heavy prose scores meaningfully lower
> than simple prose, and empty text short-circuits safely; (2) a real audit through the full
> pipeline and BullMQ worker against a live fixture page with deliberately broken grammar produced
> a "Grammar/Spelling Issues" finding (confidence 0.87) listing 8 real issues with correct
> suggested corrections ("These", "is", "don't", "delivered", "the"), and the audit reached
> `COMPLETED` normally.
>
> **A new Workflow Engine (`packages/engines/workflow-engine`) replays recorded, human-authored
> multi-step flows** (login, registration, checkout, booking, payment) via a real Playwright
> browser — docs/02 V2's "Workflow Validation," deliberately pulled forward into V1 at the user's
> explicit request (see docs/02's matching scope-acceleration note). A genuinely separate Engine
> from the Functional Engine (broken-link checking only — CLAUDE.md non-negotiable #4, one
> responsibility per Engine) and from the Browser Engine, despite both driving Playwright: the
> Browser Engine's `scope: "page"` closes its browser after every single page, which can't hold a
> session open across a flow's multiple steps the way a real login-then-checkout journey needs,
> so this Engine manages its own browser lifecycle entirely independently, per flow. New schema:
> `TestFlow`/`FlowStep` (project-scoped, authored via a new "Test Flows" section on the Testing
> Configuration page — a form-based step editor, not a live browser-interaction recorder; each
> step is one deterministic Playwright action/assertion — NAVIGATE/CLICK/FILL/PRESS_KEY/
> ASSERT_VISIBLE/ASSERT_TEXT/ASSERT_URL — authored by a QA engineer, never AI-generated or
> autonomously discovered, so this doesn't cross either of CLAUDE.md's real V1 exclusions). `scope:
> "audit"` (once per audit, not once per page) since a flow spans a whole journey, not one page;
> depends on `discovery-engine` and reads the Orchestrator-resolved `anchorPage` (the first
> discovered page) from `context.configuration` to attach its findings/evidence to, since
> `persistFindings` requires an exact Page-URL match and this Engine's findings aren't naturally
> about any single page. A flow that fully passes produces no finding (matching content/success
> isn't evidence of a problem, same convention as every other engine); the first step that fails
> stops the flow and is reported exactly as observed — its real error message and a screenshot at
> the moment of failure — not paraphrased or guessed at. Rides along whenever Functional
> Validation is selected (not its own checkbox), same "always included alongside" treatment as
> Figma/Element Matching. **Live-verified** three ways: (1) `runner.verify.ts`, a manual fixture
> script driving a real Playwright browser against a real local fixture login page (no mocking) —
> confirming a correct-credentials flow passes end-to-end, a wrong-password flow is correctly
> reported as failed at the exact assertion step with a real error message and a non-empty
> screenshot, and a step targeting a nonexistent selector fails rather than silently passing; (2)
> authoring a real flow through the actual Testing Configuration UI end-to-end (form → Server
> Action → Prisma → Postgres) and confirming it was stored with the exact steps entered; (3) two
> real audits through the full pipeline and BullMQ worker against a live fixture login page — a
> flow with correct credentials produced zero findings (correctly passing), and a second flow with
> a wrong password produced a real "Test Flow Failed" finding (confidence 0.95, severity HIGH)
> correctly attributing the failure to step 4 ("Assert URL contains "/dashboard"") with the actual
> observed URL, a real uploaded failure screenshot, and both audits reached `COMPLETED` normally.
>
> **Two real bugs found and fixed via a live audit against a real 20-page site**
> (tct.1020dev.com), reported as "audit stuck in progress, engines waiting, nothing happened":
> (1) the audit wasn't actually stuck — a real 20-page site takes several minutes end-to-end under
> the current sequential per-page pipeline, which can look stalled if watched only briefly (a
> separate, known limitation — non-negotiable #10 calls for parallel page execution, not yet
> built); but investigating surfaced (2) the Visual Engine's `computeSsim()` was silently crashing
> on **every single real page** with a raw WASM abort (a bare number, not a JS `Error` — e.g. the
> literal value `946174616`), because it held ~15 float32 Mats alive simultaneously at native
> resolution — fine for every synthetic test fixture (120x120) used during development, but a real
> full-page screenshot (1440x8808, live-observed) needs 750MB+ of simultaneous WASM heap that way.
> Fixed by downscaling both images (capping the longer dimension to 2000px, `cv.INTER_AREA`)
> before running the SSIM pipeline, then scaling detected regions' bounding boxes back up to the
> original screenshot's pixel space so reported coordinates still correctly locate the change on
> the real evidence image; `ssim.verify.ts` gained a permanent large-image (1440x8800) regression
> case so this can't silently recur. (3) Separately, the Confidence Engine's `dependencies` array
> (`["content-engine", "functional-engine", "ui-validation-engine"]`) was stale — visual-engine,
> browser-validation-engine, and workflow-engine were all added after it and never added as
> dependencies, so the topological sort in `registry.ts`'s `resolveExecutionOrder()` (which only
> orders by declared `dependencies`, not by "does this engine write findings") had no reason to run
> Confidence after them; live-observed on the same real audit, Visual was still `RUNNING` while
> Confidence had already completed, meaning Visual/Browser Validation/Workflow findings silently
> skipped the confidence-blending step entirely. Fixed by adding all three to Confidence's
> dependency list. **Live re-verified** against the same real site after both fixes: Visual
> completed with `error_count: 0` across all 20 pages (previously crashed on every one), correctly
> ran before Confidence (confirmed via `engine_results` mid-run: Visual `RUNNING` while Confidence
> still `WAITING`), and a real Visual finding's persisted confidence was `0.8` — the blended score
> (raw 0.75 + Confidence Engine's bonuses), not the engine's own raw, unblended value — proving the
> blend now actually applies. **Separately flagged, not yet fixed**: the same real audit run
> revealed the Report Engine can fail to upload its PDF ("the object exceeded the maximum allowed
> size") when many high-resolution full-page screenshots are embedded inline as base64 for a
> larger audit — a real gap (report generation silently produces no PDF for bigger audits), but a
> proper fix needs an image-compression step before embedding, which wasn't in scope for this
> investigation.
>
> **The Live Audit page (`apps/web/src/app/(app)/audit-center/live/[auditId]/page.tsx` +
> `live-audit-view.tsx`) never actually updated after its initial load** — a second, independent
> root cause of "audit appears stuck," reported directly by the user and reproduced live. The page
> is a Server Component that fetches the Audit + Findings exactly once per request; `LiveAuditView`
> (its Client Component) rendered that snapshot with **zero polling mechanism of any kind** — no
> `setInterval`, no `router.refresh()` on a timer, nothing — so once loaded it stayed frozen at
> whatever progress existed at that moment, even though the backend (BullMQ worker) had genuinely
> continued and finished minutes later. It also carried leftover mock scaffolding from before real
> engines existed: a hardcoded "Audit Log" with fabricated timestamps ("Crawler Completed",
> "Discovery Completed" at made-up offsets, unrelated to any real engine event) and a "Skip to
> Completion (demo)" button that navigated to the summary page regardless of whether the audit had
> actually finished. Fixed: `LiveAuditView` now polls via `router.refresh()` every 3s while
> `audit.status` is non-terminal, the "Audit Log" is built from real `engineResults` (real
> engine/status/`durationSeconds`), the static "in progress" label was replaced with the real
> `audit.status`, and the demo button was replaced with a genuine "View Summary" link that only
> appears once the audit has actually reached `completed`/`failed`.
>
> **A second bug surfaced immediately during live-verification of that fix**: every server-
> rendered page in this app pays a real network round trip to Supabase Auth's `getUser()` inside
> `requireUser()` before doing anything else — correct and intentional (it revalidates the session
> against Supabase's servers rather than trusting a locally-decoded, unverified JWT — see
> `session.ts`'s own comment), but live-observed at **~4 seconds per request** in this environment
> (this Supabase project's region is `ap-northeast-2`). That's *longer* than the first version of
> the poll interval (a flat 3s `setInterval`), so requests stacked up and resolved out of order —
> the Network tab showed genuinely fresh, fully up-to-date/completed data coming back, yet the
> rendered page stayed frozen at 0%, because a slow, stale in-flight request could still resolve
> and get applied after a faster, newer one. Fixed by guarding with a `refreshPending` ref: the
> next poll is skipped (not queued) until the current one has actually landed and produced a new
> `audit` prop, so at most one refresh is ever in flight regardless of how slow any single request
> is. **Not fixed, flagged for a separate decision**: the underlying ~4s-per-page Auth round trip
> is a real, systemic latency floor affecting every page in the app, not just this one — a
> genuine contributor to the "everything feels slow" complaints from earlier in this project's
> history. Properly addressing it (moving the Supabase project to a nearer region, or adding a
> short-TTL server-side cache for validated sessions) is an infrastructure decision with real
> tradeoffs (region migration is disruptive; caching validated auth weakens the "always
> revalidate" security posture Supabase's own guidance recommends) that wasn't made unilaterally
> here. **Live re-verified** end-to-end after both fixes: watched the same Live Audit page,
> untouched (no manual reload), through an entire real audit run — progress genuinely advanced
> (0% → 38% → 88% → 100%), the Audit Log showed each engine's real completion in order, the page
> correctly landed on "— · completed", and the real "View Summary" button appeared automatically.

## Architecture Philosophy

tentwenty QA Studio is **not** a monolith. It is a collection of independent Engines coordinated by a single
Core Platform. Every architectural decision must support: accuracy, speed, maintainability,
extensibility, reliability.

## High-Level System Diagram

```
User
 │
Next.js Frontend
 │
Core Platform API
 │
Engine Orchestrator
 │
 ┌────────────────────────────────────────┐
 │ Discovery Engine                       │
 │ Browser Engine                         │
 │ Figma Engine                           │
 │ Element Matching Engine                │
 │ UI Validation Engine                   │
 │ Content Engine                         │
 │ Functional Engine                      │
 │ Accessibility Engine                   │
 │ Performance Engine                     │
 │ Security Engine                        │
 │ Confidence Engine                      │
 │ Evidence Engine                        │
 │ AI Engine                              │
 │ Report Engine                          │
 └────────────────────────────────────────┘
 │
PostgreSQL / Supabase
 │
Object Storage (Supabase Storage / S3)
 │
Screenshots • Reports • Evidence • Logs
```

## Core Platform Responsibilities

The Core Platform is the **only** coordinator. It owns: authentication, project management,
engine registration, engine execution, job scheduling, progress tracking, result aggregation,
report generation, storage, audit history.

> **The Core Platform never performs validation. Validation belongs exclusively to Engines.**

## The One Rule Enforced Everywhere: No Direct Engine-to-Engine Communication

```
CORRECT:                          INCORRECT:
Engine → Core Platform → Engine   Engine → Engine → Engine
```

All coordination, data hand-off, and sequencing pass through the Core Platform / Orchestrator.
This is not just a guideline — it should be structurally impossible in code (e.g. Engines should
have no import/reference to another Engine's module).

## Engine Categories

| Category | Engines | Role |
|---|---|---|
| **Collection** | Discovery, Browser, Figma | Gather data only. Never judge. |
| **Validation** | UI, Visual, Content, Functional, Accessibility, Performance, Security | Deterministic judgment only. One concern per engine. |
| **Processing** | Confidence, Evidence, AI, Report | Synthesize what Validation Engines produced. |

## Engine Lifecycle (every Engine, no exceptions)

```
Registered → Initialized → Ready → Running → Completed → Archived
```

On error:
```
Running → Failed → Retry (optional, transient only) → Completed or Failed
```

**Retry policy:**
- Retry: browser crash, timeout, temporary network issue. Max **2 attempts**.
- Never retry: invalid configuration, authentication failure, missing project, invalid Figma
  file — these are permanent failures, not transient ones.

## Standard Engine Interface (mandatory — no custom shapes)

Every Engine implements exactly these five methods:

```
initialize()
validate()
collectEvidence()
calculateConfidence()
cleanup()
```

## Engine Registration

Every Engine registers at application startup and exposes: Engine ID, Name, Version,
Description, Dependencies, Supported Validation Types, Health Status.

## Engine Input (common shape, all Engines)

Minimum fields: Audit ID, Project ID, Environment, Page URL, Configuration, Browser Context,
Shared Resources. **Engines must not request data directly from other Engines** — only from the
shared input the Core Platform provides.

## Engine Output (standard shape, no custom formats)

```
Engine Result:
  - Engine Name
  - Status
  - Duration
  - Findings
  - Evidence
  - Metrics
  - Errors
```

## Finding Schema (shared platform-wide — this is the contract)

```
Finding:
  - Finding ID
  - Engine
  - Severity
  - Confidence
  - Category
  - Title
  - Description
  - Expected Result
  - Actual Result
  - Suggested Resolution
  - Evidence References
  - Timestamp
```

> **Platform extension (resolved during frontend build):** `Business Impact` was added as an
> additional field beyond this baseline contract — the Findings UI has a dedicated section for it,
> distinct from `Description`. Engines populate it the same way as `Suggested Resolution`. This is
> an additive extension, not a deviation — all fields above remain mandatory and unchanged.

## Evidence Schema

Evidence is **referenced, not embedded**. Supported types: Screenshot, Highlighted Screenshot,
DOM Snapshot, HTML Snapshot, CSS Snapshot, Console Logs, Network Logs, API Response, Trace File.
Each evidence item stores: Type, Storage Path, Created Time, Related Finding.

## Confidence Model

Each Engine assigns an **initial** confidence score for its own findings (e.g. DOM Match 100%,
CSS Validation 95%, Visual Validation 92%, Network Validation 100%). **No single Engine decides
the final confidence** — the Confidence Engine blends these into one final score. This is the
mechanism that keeps even deterministic engines from unilaterally deciding a finding's
reliability.

## Execution Strategy

Engines execute in dependency order where a dependency exists, but **independent Engines run in
parallel wherever possible** — this is a load-bearing performance requirement (DNA 07), not an
optimization to skip.

```
Discovery → Browser → UI → Content → Functional   (sequential dependency chain example)

Homepage:
  ├── UI Validation
  ├── Content Validation
  ├── Console Monitoring
  ├── Network Monitoring
  └── Screenshot Capture                            (parallel within a page)
```

Each page of an audit is also an independent execution unit — audits parallelize across pages,
not just across engines.

## Error Handling — Partial Failure Is Acceptable, Total Failure Is Not

```
Engine Failure → Log Error → Mark Engine Failed → Continue Remaining Engines →
Include Failure in Final Report
```

No single Engine may become a single point of failure for the whole audit.

## Logging (per Engine)

Every Engine logs: Start Time, End Time, Duration, Status, Findings Count, Error Count.
Logs must be structured and searchable — never plain unstructured text.

## Health Monitoring

Every Engine exposes one of: Healthy, Running, Waiting, Failed, Disabled. The Dashboard surfaces
this live.

## Versioning

Each Engine maintains its **own** version independently (e.g. UI Engine v1.2.0, Content Engine
v1.0.4). Engine updates must never require updating the entire platform.

## Configuration Hierarchy

```
Global → Project → Environment
```
Environment config overrides Project config; Project config overrides Global config.

## Scalability Rule

tentwenty QA Studio scales by **adding** Engines, not modifying existing ones. Future Engines (Mobile, API,
SEO, Localization, Visual Regression) must integrate through the existing framework without
requiring architectural redesign of what already exists.

## Definition of Done — for any new Engine

An Engine is complete only when it: registers successfully; executes independently; follows the
standard lifecycle; returns the standard output schema; generates evidence; integrates with the
Confidence Engine; integrates with the Report Engine; passes automated tests. No exceptions —
skipping any of these is not an acceptable shortcut even under deadline pressure.
