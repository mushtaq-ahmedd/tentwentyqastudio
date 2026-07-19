import { chromium, type Browser } from "playwright";
import {
  registerEngine,
  TransientEngineError,
  uploadEvidence,
  type BrowserPageArtifacts,
  type Engine,
  type EngineContext,
} from "@tentwenty/core";

const NAVIGATION_TIMEOUT_MS = 15_000;
/** Extra settle time after `load` for late console/network activity — safer than waiting for
 * `networkidle`, which never resolves on pages with long-lived connections (analytics beacons,
 * websockets). Documented tradeoff, not an oversight — see README. */
const SETTLE_MS = 1_000;

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

      const browserPage = await browser.newPage();
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
        await browserPage.goto(page.url, { waitUntil: "load", timeout: NAVIGATION_TIMEOUT_MS });
        await browserPage.waitForTimeout(SETTLE_MS);
      } catch (err) {
        throw new TransientEngineError(`Failed to navigate to ${page.url}: ${(err as Error).message}`);
      }

      const screenshotBuffer = await browserPage.screenshot({ fullPage: true });
      const domHtml = await browserPage.content();

      const [screenshotPath, domSnapshotPath, consoleLogPath, networkLogPath] = await Promise.all([
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
      ]);

      const artifacts: BrowserPageArtifacts = {
        screenshotPath,
        domSnapshotPath,
        consoleLogPath,
        networkLogPath,
        domHtml,
        consoleMessages,
        networkErrors,
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
