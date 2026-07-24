/**
 * Links & Images — the first capability rebuilt under the new "one capability at a time,
 * production-grade before moving on" discipline (see docs/03's Links & Images redesign note).
 * Detects broken internal links, broken external links, broken images, and invalid redirects
 * against every link/image the Browser Engine found on the real rendered page — not a byproduct
 * of Discovery's crawl (that used to skip external links entirely and had no redirect visibility
 * at all; see link-checker.ts's header for the redesign rationale).
 *
 * Every finding carries a mandatory `Location` (selector + bounding box, captured by Browser
 * Engine at the same DOM pass that found the link/image) and a real highlighted screenshot drawn
 * at that exact location — not a page-level screenshot with no indication of where the problem
 * is. This is the first Engine to adopt the Location/highlighted-screenshot rules; every other
 * Engine keeps its current (page-level-only) behavior until its own turn in the build order.
 */
import {
  registerEngine,
  drawHighlightBox,
  downloadEvidenceBuffer,
  uploadEvidence,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
  type FindingLocation,
  type PageImage,
  type PageLink,
} from "@tentwenty/core";
import { checkUrlsPooled, type LinkCheckResult } from "./link-checker";

const CONCURRENCY = 8;
/** Stashed on `context.sharedResources` under this key (not a named field on the shared type —
 * this cache is a private implementation detail of this Engine's own per-audit run, not something
 * any other Engine reads or the Core Platform coordinates; see index.ts's design note). Scoped
 * correctly because the Orchestrator creates one `context` per audit and reuses it across every
 * page-scoped call within that run — never across different audits. */
const CACHE_KEY = "__linksAndImagesCheckCache";

type CheckedItem =
  | { kind: "link"; item: PageLink; result: LinkCheckResult }
  | { kind: "image"; item: PageImage; result: LinkCheckResult };

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine"> {
  return { pageUrl: context.page!.url, engine: "FUNCTIONAL" };
}

function locationFor(item: PageLink | PageImage, textSnippet: string | null): FindingLocation {
  return { selector: item.selector, textSnippet, boundingBox: item.boundingBox };
}

function categoryAndSeverity(checked: CheckedItem): { category: string; severity: "HIGH" | "MEDIUM" } {
  if (checked.result.status === "invalid-redirect") {
    return { category: "Invalid Redirect", severity: "HIGH" };
  }
  return checked.kind === "link"
    ? { category: "Broken Link", severity: "HIGH" }
    : { category: "Broken Image", severity: "MEDIUM" };
}

function buildFinding(context: EngineContext, checked: CheckedItem): EngineFinding {
  const { item, result, kind } = checked;
  const { category, severity } = categoryAndSeverity(checked);
  const reason = result.status === "broken" || result.status === "invalid-redirect" ? result.reason : "";
  const label = kind === "link" ? "link" : "image";
  const identifier =
    kind === "link"
      ? (item as PageLink).text
        ? `"${(item as PageLink).text}" (${item.url})`
        : item.url
      : `${item.url}${(item as PageImage).alt ? ` (alt: "${(item as PageImage).alt}")` : ""}`;

  return {
    ...findingBase(context),
    severity,
    confidence: 0.95,
    category,
    title: category === "Invalid Redirect" ? `Invalid redirect: ${item.url}` : `Broken ${label}: ${identifier}`,
    description:
      category === "Invalid Redirect"
        ? `This ${label} (${identifier}) redirects to a destination that doesn't resolve correctly: ${reason}`
        : `This ${label} (${identifier}) failed to resolve: ${reason}`,
    expectedResult: `This ${label} resolves successfully with no redirect issues.`,
    actualResult: reason,
    businessImpact:
      kind === "link"
        ? "A broken link interrupts the user's journey and reads as an unmaintained, untrustworthy site."
        : "A broken image looks unpolished and can hide important content (product photos, icons, logos).",
    suggestedResolution:
      category === "Invalid Redirect"
        ? "Fix the redirect chain — point it directly at a working destination, or remove the redirect if it's no longer needed."
        : `Fix or remove the ${label}'s target — update it to point at a working destination.`,
    location: locationFor(item, kind === "link" ? (item as PageLink).text || null : (item as PageImage).alt || null),
    evidence: [],
  };
}

export const functionalEngine: Engine = {
  id: "functional-engine",
  name: "FUNCTIONAL",
  version: "0.4.0",
  description:
    "Links & Images: broken internal/external links, broken images, and invalid redirects — checked directly against every link/image the Browser Engine found on the real rendered page (HEAD-first/GET-fallback, manual redirect-chain tracking, per-audit deduped). Every finding carries a precise Location and a highlighted screenshot.",
  dependencies: ["browser-engine"],
  supportedValidationTypes: ["FUNCTIONAL_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    if (!artifacts) return [];

    context.sharedResources[CACHE_KEY] ??= new Map<string, Promise<LinkCheckResult>>();
    const cache = context.sharedResources[CACHE_KEY] as Map<string, Promise<LinkCheckResult>>;

    const allUrls = [...artifacts.links.map((l) => l.url), ...artifacts.images.map((i) => i.url)];
    await checkUrlsPooled(allUrls, cache, CONCURRENCY);

    const findings: EngineFinding[] = [];

    for (const link of artifacts.links) {
      const result = await cache.get(link.url);
      if (!result || result.status === "ok") continue;
      findings.push(buildFinding(context, { kind: "link", item: link, result }));
    }
    for (const image of artifacts.images) {
      const result = await cache.get(image.url);
      if (!result || result.status === "ok") continue;
      findings.push(buildFinding(context, { kind: "image", item: image, result }));
    }

    return findings;
  },

  async collectEvidence(context: EngineContext, findings: EngineFinding[]) {
    if (findings.length === 0) return findings;

    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    if (!artifacts) return findings;

    // The plain screenshot is downloaded once per page and reused as the base for every finding's
    // own highlighted variant — each finding draws its box at a different location.
    let baseScreenshot: Buffer | null = null;
    try {
      baseScreenshot = await downloadEvidenceBuffer(artifacts.screenshotPath);
    } catch (err) {
      console.warn(`Functional Engine: could not download base screenshot for highlighting: ${(err as Error).message}`);
    }

    for (const finding of findings) {
      const evidence: EngineEvidence[] = [{ type: "SCREENSHOT", content: artifacts.screenshotPath }];

      const box = finding.location?.boundingBox;
      if (baseScreenshot && box) {
        try {
          const highlighted = drawHighlightBox(baseScreenshot, box);
          const highlightedPath = await uploadEvidence(
            context.auditId,
            context.page!.id,
            "highlighted-screenshot",
            highlighted,
            "image/png"
          );
          evidence.push({ type: "HIGHLIGHTED_SCREENSHOT", content: highlightedPath });
        } catch (err) {
          console.warn(`Functional Engine: could not generate highlighted screenshot: ${(err as Error).message}`);
        }
      }

      finding.evidence = evidence;
    }

    return findings;
  },

  async calculateConfidence(finding: EngineFinding) {
    return finding.confidence; // Already set deterministically in validate() above.
  },

  async cleanup() {
    // Nothing to tear down — no browser/session owned by this engine.
  },
};

registerEngine(functionalEngine);
