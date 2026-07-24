import { chromium, type Browser } from "playwright";
import {
  registerEngine,
  recordPageScreenshot,
  parseViewport,
  TransientEngineError,
  uploadEvidence,
  type BrowserPageArtifacts,
  type DomElement,
  type Engine,
  type EngineConfig,
  type EngineContext,
  type PageImage,
  type PageLink,
} from "@tentwenty/core";

/** Fallback when an engine runs outside the Orchestrator's normal context-building (shouldn't
 * happen in production — see README). Mirrors PlatformSettings' own defaults. */
const FALLBACK_ENGINE_CONFIG: EngineConfig = {
  screenshotQuality: "High",
  defaultTimeoutSeconds: 15,
  retryCount: 2,
  defaultViewport: "Desktop (1440x900)",
};

/** Extra settle time after `load` for late console/network activity — safer than waiting for
 * `networkidle`, which never resolves on pages with long-lived connections (analytics beacons,
 * websockets). Documented tradeoff, not an oversight — see README. */
const SETTLE_MS = 1_000;
/** Bound on how many text-bearing elements get captured per page (Element Matching's candidate
 * pool) — a content-heavy page shouldn't produce unbounded data. */
const MAX_DOM_ELEMENTS = 500;
/** Bound on how many links/images get captured per page (Links & Images capability's input) —
 * same "don't let one content-heavy page produce unbounded data" rationale as MAX_DOM_ELEMENTS. */
const MAX_LINKS_OR_IMAGES = 300;

/**
 * Runs inside the real rendered page (not static HTML parsing — position/size and computed style
 * both require an actual layout/render pass) to collect text-matching candidates for the Element
 * Matching Engine, each with a curated computed-style summary (docs/04 Browser Engine: "extract
 * computed CSS") for future typography/color checks. Kept as a single self-contained function
 * since Playwright serializes it into the page context.
 */
function collectDomElements(maxElements: number): DomElement[] {
  const results: DomElement[] = [];
  const all = document.querySelectorAll("body *");
  for (const el of Array.from(all)) {
    if (results.length >= maxElements) break;
    let directText = "";
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) directText += node.textContent ?? "";
    }
    directText = directText.trim().replace(/\s+/g, " ");
    if (!directText) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    const computed = getComputedStyle(el);
    results.push({
      tag: el.tagName.toLowerCase(),
      text: directText.slice(0, 200),
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      style: {
        color: computed.color,
        backgroundColor: computed.backgroundColor,
        fontFamily: computed.fontFamily,
        fontSize: computed.fontSize,
        fontWeight: computed.fontWeight,
        display: computed.display,
      },
    });
  }
  return results;
}

/**
 * Runs inside the real rendered page to collect every link and image with its resolved absolute
 * URL, a best-effort CSS selector, and its real on-page bounding box (`getBoundingClientRect()`)
 * — the Links & Images capability's actual input, replacing what used to be a byproduct of
 * Discovery's separate static-HTML crawl (docs/03's Links & Images redesign note). A rendered
 * page is the more accurate source: it reflects client-side-inserted links/images a plain HTML
 * fetch would miss, and it's the only place a real bounding box (needed for the highlighted-
 * screenshot evidence) can come from at all.
 */
function collectLinksAndImages(maxEach: number): { links: PageLink[]; images: PageImage[] } {
  // Deliberately no named helper functions anywhere in this function body — not `function
  // name(){}`, not even `const name = () => {}` (live-verified: esbuild/tsx wraps *both* forms
  // with a `__name(fn, "name")` call to preserve `.name` after transpilation). Playwright's
  // `page.evaluate()` serializes this whole function via `.toString()` and runs the source fresh
  // inside the page's isolated context, which has no access to that `__name` helper (it lives in
  // the Node-side module scope, not inside this function's own text) — so any named binding here
  // throws "ReferenceError: __name is not defined" the moment the page tries to run it
  // (live-observed on a real audit). The cssPath/bounding-box logic below is duplicated inline in
  // one shared, *anonymous* forEach callback instead of being extracted into a reusable named
  // helper — empirically confirmed via `Function.prototype.toString()` to produce no `__name` wrapper.
  const links: PageLink[] = [];
  const images: PageImage[] = [];

  const linkEls = Array.from(document.querySelectorAll("a[href]")).map((el) => ({ el, kind: "link" as const }));
  const imageEls = Array.from(document.querySelectorAll("img[src]")).map((el) => ({ el, kind: "image" as const }));

  [...linkEls, ...imageEls].forEach(({ el, kind }) => {
    if (kind === "link" && links.length >= maxEach) return;
    if (kind === "image" && images.length >= maxEach) return;

    const attr = kind === "link" ? el.getAttribute("href") : el.getAttribute("src");
    if (!attr) return;
    if (kind === "link" && (attr.startsWith("mailto:") || attr.startsWith("tel:") || attr.startsWith("javascript:") || attr.startsWith("#"))) return;

    let url: string;
    try {
      url = new URL(attr, location.href).toString();
    } catch {
      return;
    }

    let selector: string;
    if (el.id) {
      selector = `#${CSS.escape(el.id)}`;
    } else {
      const parts: string[] = [];
      let node: Element | null = el;
      let depth = 0;
      while (node && depth < 4) {
        let part = node.tagName.toLowerCase();
        const parent: Element | null = node.parentElement;
        if (parent) {
          const siblings = Array.from(parent.children).filter((c) => c.tagName === node!.tagName);
          if (siblings.length > 1) part += `:nth-of-type(${siblings.indexOf(node) + 1})`;
        }
        parts.unshift(part);
        node = parent;
        depth++;
      }
      selector = parts.join(" > ");
    }

    // getBoundingClientRect() is viewport-relative, but the page screenshot is captured with
    // `fullPage: true` (the whole scrollable document) — adding the current scroll offset
    // converts to document-relative coordinates that actually line up with pixels in that
    // screenshot, regardless of scroll position at capture time.
    const rect = el.getBoundingClientRect();
    const boundingBox =
      rect.width === 0 || rect.height === 0
        ? null
        : {
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          };

    if (kind === "link") {
      links.push({
        url,
        selector,
        text: (el.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 100),
        boundingBox,
      });
    } else {
      images.push({
        url,
        selector,
        alt: el.getAttribute("alt") ?? "",
        boundingBox,
      });
    }
  });

  return { links, images };
}

export const browserEngine: Engine = {
  id: "browser-engine",
  name: "BROWSER",
  version: "0.2.0",
  description:
    "Renders each discovered page in a real browser, capturing screenshots, DOM, console output, network activity, and every link/image (resolved URL, selector, bounding box) for later Validation engines to judge.",
  dependencies: ["discovery-engine"],
  supportedValidationTypes: [],
  scope: "page",

  async initialize(context: EngineContext) {
    const page = context.page;
    if (!page) throw new Error('Browser Engine requires context.page (scope: "page").');

    const engineConfig =
      (context.configuration.engineConfig as EngineConfig | undefined) ?? FALLBACK_ENGINE_CONFIG;
    const navigationTimeoutMs = engineConfig.defaultTimeoutSeconds * 1000;
    const viewport = parseViewport(engineConfig.defaultViewport);

    let browser: Browser;
    try {
      browser = await chromium.launch();
    } catch (err) {
      throw new TransientEngineError(`Failed to launch browser: ${(err as Error).message}`);
    }

    try {
      const consoleMessages: string[] = [];
      const networkErrors: string[] = [];
      const networkLog: string[] = [];

      const browserPage = await browser.newPage({ viewport });
      browserPage.on("console", (msg) => {
        consoleMessages.push(`[${msg.type()}] ${msg.text()}`);
      });
      browserPage.on("pageerror", (err) => {
        consoleMessages.push(`[pageerror] ${err.message}`);
      });
      browserPage.on("response", (res) => {
        const line = `${res.status()} ${res.request().method()} ${res.url()}`;
        networkLog.push(line);
        if (res.status() >= 400) networkErrors.push(line);
      });

      try {
        await browserPage.goto(page.url, { waitUntil: "load", timeout: navigationTimeoutMs });
        await browserPage.waitForTimeout(SETTLE_MS);
      } catch (err) {
        throw new TransientEngineError(`Failed to navigate to ${page.url}: ${(err as Error).message}`);
      }

      // Deliberately always PNG regardless of engineConfig.screenshotQuality: the Visual Engine's
      // pixelmatch/pngjs comparison (packages/engines/visual-engine) hard-depends on decoding this
      // exact evidence as PNG. Playwright's PNG screenshots have no lossy "quality" axis anyway
      // (only `type: "jpeg"` does) — switching format based on this setting would silently break
      // cross-audit visual regression for any project/environment that isn't "High", which is a
      // real Engine Framework violation (docs/03: no Engine's config changes may break another
      // Engine). screenshotQuality is still resolved through the full hierarchy above; it just has
      // no safe lever to pull on the canonical screenshot yet — flagged in README, not silently
      // dropped.
      const screenshotBuffer = await browserPage.screenshot({ fullPage: true, type: "png" });
      const domHtml = await browserPage.content();
      const domElements = await browserPage.evaluate(collectDomElements, MAX_DOM_ELEMENTS);
      const { links, images } = await browserPage.evaluate(collectLinksAndImages, MAX_LINKS_OR_IMAGES);

      const [screenshotPath, domSnapshotPath, consoleLogPath, networkLogPath, cssSnapshotPath] = await Promise.all([
        uploadEvidence(context.auditId, page.id, "screenshot", screenshotBuffer, "image/png"),
        uploadEvidence(context.auditId, page.id, "dom-snapshot", domHtml, "text/html"),
        uploadEvidence(
          context.auditId,
          page.id,
          "console-log",
          consoleMessages.join("\n") || "(no console output)",
          "text/plain"
        ),
        uploadEvidence(
          context.auditId,
          page.id,
          "network-log",
          networkLog.join("\n") || "(no network activity captured)",
          "text/plain"
        ),
        // Every domElements entry's computed-style summary, keyed by tag/text/position so a
        // reader can see which element each style belongs to — not the full page stylesheet.
        uploadEvidence(context.auditId, page.id, "css-snapshot", JSON.stringify(domElements, null, 2), "application/json"),
      ]);

      // Independent of Evidence (which only exists where a Finding references it) — the Visual
      // Engine needs this page's screenshot history regardless of whether anything was found.
      await recordPageScreenshot(context.projectId, context.auditId, page.url, screenshotPath);

      const artifacts: BrowserPageArtifacts = {
        screenshotPath,
        domSnapshotPath,
        consoleLogPath,
        networkLogPath,
        cssSnapshotPath,
        domHtml,
        consoleMessages,
        networkErrors,
        domElements,
        links,
        images,
      };
      context.sharedResources.pageArtifacts ??= {};
      context.sharedResources.pageArtifacts[page.url] = artifacts;
    } finally {
      await browser.close();
    }
  },

  async validate() {
    return []; // Collection engine — never judges (docs/03 Engine Categories).
  },

  async collectEvidence(_context, findings) {
    return findings;
  },

  async calculateConfidence() {
    return 1; // N/A — a Collection engine never produces findings to score.
  },

  async cleanup() {
    // Browser session is already closed at the end of initialize() — see README's "one browser
    // per page" tradeoff note.
  },
};

registerEngine(browserEngine);
