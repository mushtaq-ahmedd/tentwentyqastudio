/**
 * Manual fixture verification for checkUrl()/checkUrlsPooled() — drives real HTTP requests
 * against a real local fixture server (no mocking), same discipline as ssim.verify.ts/
 * grammar.verify.ts/runner.verify.ts elsewhere. Requires the fixture server running at
 * http://localhost:4180 (see the session scratch directory's link-checker-fixture-server.js).
 *
 * Run via:
 *   pnpm --filter @tentwenty/functional-engine exec tsx src/link-checker.verify.ts
 */
import { checkUrl, checkUrlsPooled } from "./link-checker";

const BASE = "http://localhost:4180";

let failures = 0;
function check(label: string, condition: boolean, detail: string) {
  if (condition) {
    console.log(`PASS  ${label} (${detail})`);
  } else {
    console.error(`FAIL  ${label} (${detail})`);
    failures++;
  }
}

async function main() {
  const ok = await checkUrl(`${BASE}/ok`);
  check("a real 200 page resolves ok", ok.status === "ok", JSON.stringify(ok));

  const notFound = await checkUrl(`${BASE}/not-found`);
  check("a 404 page is broken", notFound.status === "broken", JSON.stringify(notFound));
  if (notFound.status === "broken") {
    check("broken reason names the real status", notFound.reason.includes("404"), notFound.reason);
  }

  const serverError = await checkUrl(`${BASE}/server-error`);
  check("a 500 page is broken", serverError.status === "broken", JSON.stringify(serverError));

  const redirectToOk = await checkUrl(`${BASE}/redirect-to-ok`);
  check("a redirect landing on a real page resolves ok, not as its own finding", redirectToOk.status === "ok", JSON.stringify(redirectToOk));

  const redirectTo404 = await checkUrl(`${BASE}/redirect-to-404`);
  check("a redirect landing on a 404 is an invalid-redirect, not a plain broken link", redirectTo404.status === "invalid-redirect", JSON.stringify(redirectTo404));
  if (redirectTo404.status === "invalid-redirect") {
    check("invalid-redirect chain includes both hops", redirectTo404.chain.length === 2, JSON.stringify(redirectTo404.chain));
  }

  const loop = await checkUrl(`${BASE}/loop-a`);
  check("a redirect loop is detected as invalid-redirect", loop.status === "invalid-redirect", JSON.stringify(loop));
  if (loop.status === "invalid-redirect") {
    check("loop reason mentions a loop", loop.reason.toLowerCase().includes("loop"), loop.reason);
  }

  const tooManyHops = await checkUrl(`${BASE}/hop-0`);
  check("a redirect chain exceeding the max hop count is invalid-redirect", tooManyHops.status === "invalid-redirect", JSON.stringify(tooManyHops));
  if (tooManyHops.status === "invalid-redirect") {
    check("too-many-hops reason says so", tooManyHops.reason.toLowerCase().includes("too many redirects"), tooManyHops.reason);
  }

  const headRejected = await checkUrl(`${BASE}/head-rejected`);
  check("a server rejecting HEAD (405) is retried with GET and resolves ok", headRejected.status === "ok", JSON.stringify(headRejected));

  const unreachable = await checkUrl("http://localhost:59999/nothing-here");
  check("an unreachable host is broken, not a crash", unreachable.status === "broken", JSON.stringify(unreachable));

  // Pooled/dedup check: same URL requested 3 times should only be checked once.
  const cache = new Map();
  const urls = [`${BASE}/ok`, `${BASE}/ok`, `${BASE}/not-found`, `${BASE}/ok`];
  await checkUrlsPooled(urls, cache);
  check("pooled check dedupes identical URLs", cache.size === 2, `cache.size=${cache.size}`);
  const okResult = await cache.get(`${BASE}/ok`);
  const notFoundResult = await cache.get(`${BASE}/not-found`);
  check("pooled results are correct per URL", okResult.status === "ok" && notFoundResult.status === "broken", JSON.stringify({ okResult, notFoundResult }));

  if (failures > 0) {
    console.error(`\n${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("\nALL CHECKS PASSED");
}

main().catch((err) => {
  console.error("Verification script crashed:", err);
  process.exit(1);
});
