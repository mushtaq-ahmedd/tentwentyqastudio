/**
 * Real HTTP checking for one URL — internal or external, no distinction (docs/12/the Links &
 * Images redesign explicitly requires external links to actually be checked, unlike the old
 * Discovery-crawl-byproduct approach which never fetched cross-origin URLs at all).
 *
 * HEAD-first, GET-fallback: cheap and fast (matches `linkinator`'s standard approach, docs/08) —
 * most servers answer HEAD correctly, but some reject it (405/403/501), so a HEAD failure on
 * exactly those codes retries the same URL with GET before concluding anything.
 *
 * Redirects are followed manually (`redirect: "manual"`), not left to the HTTP client's default
 * silent-follow behavior — this is what makes redirect *chains* and *loops* observable at all
 * (live-verified: Node's fetch with `redirect: "manual"` returns a real, readable `Location`
 * header — unlike a browser's opaque-redirect filtering — so this works without any extra
 * library). A chain is only ever reported as its own "Invalid Redirect" finding when something
 * about it is actually wrong (loop, too many hops, or it lands on a broken page) — a normal
 * A→B(200) redirect is not itself a problem and resolves as `ok`.
 */

const TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 5;
/** HEAD is rejected by some servers for reasons unrelated to whether the resource actually
 * exists — retry with GET instead of concluding "broken" on these specific codes. */
const HEAD_REJECTED_STATUSES = new Set([403, 405, 501]);

export type LinkCheckResult =
  | { status: "ok" }
  | { status: "broken"; reason: string }
  | { status: "invalid-redirect"; reason: string; chain: string[] };

async function fetchOnce(url: string, method: "HEAD" | "GET"): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method, redirect: "manual", signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function checkUrl(startUrl: string): Promise<LinkCheckResult> {
  const chain: string[] = [];
  let currentUrl = startUrl;
  let method: "HEAD" | "GET" = "HEAD";
  let hops = 0;

  for (;;) {
    if (chain.includes(currentUrl)) {
      return { status: "invalid-redirect", reason: `Redirect loop: ${[...chain, currentUrl].join(" → ")}`, chain };
    }
    if (hops > MAX_REDIRECTS) {
      return { status: "invalid-redirect", reason: `Too many redirects (>${MAX_REDIRECTS}): ${chain.join(" → ")}`, chain };
    }

    let res: Response;
    try {
      res = await fetchOnce(currentUrl, method);
    } catch (err) {
      return { status: "broken", reason: `Unreachable: ${(err as Error).message}` };
    }

    if (method === "HEAD" && HEAD_REJECTED_STATUSES.has(res.status)) {
      method = "GET";
      continue; // retry this exact URL with GET — not a new hop
    }

    chain.push(currentUrl);

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) {
        return { status: "broken", reason: `Redirect (HTTP ${res.status}) with no Location header` };
      }
      currentUrl = new URL(location, currentUrl).toString();
      method = "HEAD";
      hops++;
      continue;
    }

    if (res.status >= 200 && res.status < 300) {
      return { status: "ok" };
    }

    // Terminal 4xx/5xx.
    if (chain.length > 1) {
      return {
        status: "invalid-redirect",
        reason: `Redirects to a broken page (HTTP ${res.status} ${res.statusText}): ${chain.join(" → ")}`,
        chain,
      };
    }
    return { status: "broken", reason: `HTTP ${res.status} ${res.statusText}`.trim() };
  }
}

/** Runs `checkUrl` over many URLs at once, bounded to `concurrency` in flight — sequential
 * one-at-a-time checking (the old Discovery-crawl approach) made a real audit take minutes longer
 * than it needed to for no accuracy benefit (docs/03 non-negotiable #10: parallelize independent
 * work). A shared `cache` is required, not optional: the same URL (a common footer/nav link)
 * often appears on every page of a site, and re-hitting it once per page both wastes time and
 * risks a *false* broken result if a slower external server starts rate-limiting after repeated
 * identical requests within one audit. */
export async function checkUrlsPooled(
  urls: string[],
  cache: Map<string, Promise<LinkCheckResult>>,
  concurrency = 8
): Promise<void> {
  const uncached = urls.filter((u) => !cache.has(u));
  const unique = Array.from(new Set(uncached));
  let next = 0;

  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= unique.length) return;
      const url = unique[i];
      cache.set(url, checkUrl(url));
      await cache.get(url);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, unique.length) }, worker));
}
