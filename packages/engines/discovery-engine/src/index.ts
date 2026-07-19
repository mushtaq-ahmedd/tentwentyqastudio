import * as cheerio from "cheerio";
import {
  registerEngine,
  TransientEngineError,
  type DiscoveredPage,
  type Engine,
  type EngineContext,
} from "@tentwenty/core";

const MAX_PAGES = 20;
const FETCH_TIMEOUT_MS = 10_000;
/** Non-page downloadable assets — following these wastes a page slot and, worse, makes the
 * Browser Engine's `page.goto()` throw ("Download is starting") since navigating to one triggers
 * a file download instead of a page load. Discovered via a real crawl of lipsum.com, which links
 * a banners.zip/.tar.gz — not a hypothetical case. */
const NON_PAGE_EXTENSIONS = /\.(zip|tar|gz|tgz|rar|7z|exe|dmg|pkg|msi|pdf|docx?|xlsx?|pptx?|csv|mp4|mp3|wav|avi|mov)$/i;

function normalizeUrl(url: string): string {
  const u = new URL(url);
  u.hash = "";
  if (u.pathname !== "/" && u.pathname.endsWith("/")) u.pathname = u.pathname.slice(0, -1);
  return u.toString();
}

function pageNameFromPath(pathname: string): string {
  if (pathname === "" || pathname === "/") return "Homepage";
  const segments = pathname.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  return last
    .replace(/[-_]/g, " ")
    .replace(/\.\w+$/, "")
    .replace(/\b\w/g, (c) => c.toUpperCase()) || "Untitled Page";
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal, redirect: "follow" });
  } catch (err) {
    // Timeout/network failure — retryable per docs/03's retry policy.
    throw new TransientEngineError(`Failed to fetch ${url}: ${(err as Error).message}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function crawl(baseUrl: string): Promise<DiscoveredPage[]> {
  const origin = new URL(baseUrl).origin;
  const visited = new Set<string>();
  const queue: string[] = [normalizeUrl(baseUrl)];
  const pages: DiscoveredPage[] = [];

  while (queue.length > 0 && pages.length < MAX_PAGES) {
    const current = queue.shift();
    if (!current || visited.has(current)) continue;
    visited.add(current);

    let html: string;
    try {
      const res = await fetchWithTimeout(current);
      if (!res.ok) continue; // a broken link shouldn't fail the whole crawl
      html = await res.text();
    } catch {
      continue; // one unreachable page shouldn't abort discovery of the rest
    }

    const $ = cheerio.load(html);
    const currentUrl = new URL(current);
    pages.push({ url: current, name: pageNameFromPath(currentUrl.pathname) });

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return;
      try {
        const resolved = normalizeUrl(new URL(href, current).toString());
        if (
          new URL(resolved).origin === origin &&
          !NON_PAGE_EXTENSIONS.test(new URL(resolved).pathname) &&
          !visited.has(resolved) &&
          !queue.includes(resolved)
        ) {
          queue.push(resolved);
        }
      } catch {
        // malformed href — skip
      }
    });
  }

  return pages;
}

export const discoveryEngine: Engine = {
  id: "discovery-engine",
  name: "DISCOVERY",
  version: "0.1.0",
  description:
    "Crawls a project's environment to build the page inventory later engines validate against.",
  dependencies: [],
  supportedValidationTypes: [],
  scope: "audit",

  async initialize(context: EngineContext) {
    const baseUrl = context.environment.url.startsWith("http")
      ? context.environment.url
      : `https://${context.environment.url}`;
    context.sharedResources.pages = await crawl(baseUrl);
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
    // No persistent resources (browser session, etc.) for a plain-fetch crawler.
  },
};

registerEngine(discoveryEngine);
