import * as cheerio from "cheerio";
import {
  registerEngine,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
} from "@tentwenty/core";

/**
 * docs/04 Content Engine, Mode 2 only: "Website-only grammar/readability/placeholder detection
 * (no content sheet required)". Mode 1 (Content Sheet → Website comparison) needs an approved
 * content document to compare against, which doesn't exist as a concept in the product yet — not
 * implemented here, not faked.
 */
const PLACEHOLDER_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Lorem Ipsum", pattern: /lorem ipsum/i },
  { label: "placeholder marker", pattern: /\b(TBD|TODO|FIXME)\b/ },
  { label: "placeholder marker", pattern: /\[(placeholder|insert .*?here|your .*? here)\]/i },
  { label: "sample text marker", pattern: /\b(sample text|dummy text|test content|xxxx+)\b/i },
];

type ContentMatch = { label: string; snippet: string };

function findPlaceholderMatches($: cheerio.CheerioAPI): ContentMatch[] {
  const matches: ContentMatch[] = [];
  $("body")
    .find("*")
    .each((_, el) => {
      const node = $(el);
      // Only leaf-ish text — avoids matching the same sentence once per ancestor container.
      if (node.children().length > 0) return;
      const text = node.text().trim();
      if (!text) return;
      for (const { label, pattern } of PLACEHOLDER_PATTERNS) {
        if (pattern.test(text)) {
          matches.push({ label, snippet: text.slice(0, 160) });
          break;
        }
      }
    });
  return matches;
}

function findEmptyHeadings($: cheerio.CheerioAPI): string[] {
  const empty: string[] = [];
  $("h1, h2, h3, h4, h5, h6").each((_, el) => {
    const node = $(el);
    const hasText = node.text().trim().length > 0;
    const hasMedia = node.find("img, svg").length > 0;
    if (!hasText && !hasMedia) {
      empty.push((el as { tagName?: string }).tagName?.toLowerCase() ?? "heading");
    }
  });
  return empty;
}

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine"> {
  return { pageUrl: context.page!.url, engine: "CONTENT" };
}

export const contentEngine: Engine = {
  id: "content-engine",
  name: "CONTENT",
  version: "0.1.0",
  description:
    "Deterministic website-only content checks: placeholder text, empty headings, missing page title (docs/04 Content Engine, Mode 2).",
  dependencies: ["browser-engine"],
  supportedValidationTypes: ["CONTENT_VALIDATION", "GRAMMAR_VALIDATION"],
  scope: "page",

  async initialize() {
    // No setup needed — all real work happens in validate() (docs/03 Validation engine pattern).
  },

  async validate(context: EngineContext) {
    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    if (!artifacts) return []; // Browser Engine didn't produce artifacts for this page — nothing to check.

    const $ = cheerio.load(artifacts.domHtml);
    const findings: EngineFinding[] = [];

    const placeholderMatches = findPlaceholderMatches($);
    if (placeholderMatches.length > 0) {
      const examples = placeholderMatches.slice(0, 3).map((m) => `"${m.snippet}"`).join("; ");
      findings.push({
        ...findingBase(context),
        severity: "HIGH",
        confidence: 0.97,
        category: "Placeholder Content",
        title: `Placeholder content found (${placeholderMatches.length} instance${placeholderMatches.length > 1 ? "s" : ""})`,
        description: `Found ${placeholderMatches.length} block(s) of unresolved placeholder text on this page, e.g. ${examples}.`,
        expectedResult: "All visible text is final, reviewed content — no Lorem Ipsum or placeholder markers.",
        actualResult: `Placeholder text detected: ${examples}.`,
        businessImpact: "Placeholder content shipped to real users looks unfinished and undermines trust in the page.",
        suggestedResolution: "Replace the flagged text with final, approved copy before this page goes live.",
        evidence: [],
      });
    }

    const emptyHeadings = findEmptyHeadings($);
    if (emptyHeadings.length > 0) {
      findings.push({
        ...findingBase(context),
        severity: "MEDIUM",
        confidence: 0.88,
        category: "Empty Heading",
        title: `${emptyHeadings.length} empty heading${emptyHeadings.length > 1 ? "s" : ""} found`,
        description: `Found ${emptyHeadings.length} heading element(s) (${[...new Set(emptyHeadings)].join(", ")}) with no visible text or icon content.`,
        expectedResult: "Every heading element carries visible text (or an icon/image) that describes the section it introduces.",
        actualResult: `${emptyHeadings.length} heading tag(s) render with no content.`,
        businessImpact: "Empty headings break page structure for screen-reader users and read as broken layout to sighted users.",
        suggestedResolution: "Add the missing heading text, or remove the empty heading element if it isn't needed.",
        evidence: [],
      });
    }

    const title = $("title").first().text().trim();
    if (!title) {
      findings.push({
        ...findingBase(context),
        severity: "MEDIUM",
        confidence: 0.9,
        category: "Missing Page Title",
        title: "Page is missing a <title>",
        description: "This page has no <title> element, or its <title> element is empty.",
        expectedResult: "Every page has a non-empty, descriptive <title> element.",
        actualResult: "No page title text found.",
        businessImpact: "Missing titles hurt SEO ranking and show a blank/URL-only label in browser tabs and search results.",
        suggestedResolution: "Add a concise, descriptive <title> element for this page.",
        evidence: [],
      });
    }

    return findings;
  },

  async collectEvidence(context: EngineContext, findings: EngineFinding[]) {
    const artifacts = context.sharedResources.pageArtifacts?.[context.page!.url];
    if (!artifacts || findings.length === 0) return findings;

    // Every finding on this page points at the same already-uploaded Browser Engine artifacts —
    // no re-upload needed, just reference the existing storage paths (docs/03 "Evidence is
    // referenced, not embedded").
    const shared: EngineEvidence[] = [
      { type: "SCREENSHOT", content: artifacts.screenshotPath },
      { type: "HTML_SNAPSHOT", content: artifacts.domSnapshotPath },
    ];
    for (const finding of findings) {
      finding.evidence = shared;
    }
    return findings;
  },

  async calculateConfidence(finding: EngineFinding) {
    return finding.confidence; // Already set deterministically per check in validate() above.
  },

  async cleanup() {
    // Nothing to tear down — no browser/session owned by this engine.
  },
};

registerEngine(contentEngine);
