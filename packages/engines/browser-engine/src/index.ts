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

export const browserEngine: Engine = {
  id: "browser-engine",
  name: "BROWSER",
  version: "0.1.0",
  description:
    "Renders each discovered page in a real browser, capturing screenshots, DOM, console output, and network activity for later Validation engines to judge.",
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
