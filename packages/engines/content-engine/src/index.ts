import * as cheerio from "cheerio";
import {
  matchesPagePath,
  registerEngine,
  textSimilarity,
  type ContentSheetRow,
  type Engine,
  type EngineContext,
  type EngineEvidence,
  type EngineFinding,
} from "@tentwenty/core";
import { checkGrammar } from "./grammar";
import { computeReadability } from "./readability";

/**
 * docs/04 Content Engine, two modes:
 *  - Mode 2 (below, unconditional): "Website-only grammar/readability/placeholder detection (no
 *    content sheet required)".
 *  - Mode 1 ("Content Sheet -> Website comparison", see `runContentSheetChecks` below): runs only
 *    when the project has a successfully parsed Content Sheet (`context.configuration
 *    .contentSheetRows`, resolved by the Orchestrator from the most recent PROCESSED
 *    CONTENT_SHEETS KnowledgeSource). docs never specify a file format or matching rule for this
 *    mode — see packages/core/src/content-sheet.ts's header comment for the invented contract
 *    (CSV, "Page"/"Element"/"Expected Text" columns, page matched by URL path).
 */

/** Below this text-similarity score, a DOM element isn't considered a plausible match for a
 * content sheet row's expected text — higher than Element Matching's 0.82 (`MATCH_THRESHOLD`)
 * since a content sheet's "Expected Text" is meant to be the literal approved copy, not just a
 * visually-similar design label. */
const CONTENT_MATCH_THRESHOLD = 0.85;
/** Below this, no DOM element is even loosely related — treated as "not found on the page at
 * all" rather than "found but differs". */
const NOT_FOUND_THRESHOLD = 0.3;
const PLACEHOLDER_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "Lorem Ipsum", pattern: /lorem ipsum/i },
  { label: "placeholder marker", pattern: /\b(TBD|TODO|FIXME)\b/ },
  { label: "placeholder marker", pattern: /\[(placeholder|insert .*?here|your .*? here)\]/i },
  { label: "sample text marker", pattern: /\b(sample text|dummy text|test content|xxxx+)\b/i },
];
/** Below this, a page's flowing text is too sparse for a Flesch score to mean anything (a nav-only
 * or mostly-image page shouldn't get a "hard to read" finding off a handful of words). */
const MIN_WORDS_FOR_READABILITY = 50;
/** Flesch Reading Ease's own "Very Difficult" boundary (Flesch, 1948) — flagging only below this,
 * not at "Difficult", keeps this finding rare/trusted rather than routine noise on any page with
 * a few long sentences (docs non-negotiable #3: fewer, trusted findings over noisy ones). */
const READABILITY_SCORE_CUTOFF = 30;

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

/** Restricted to elements that actually carry prose (paragraphs, list items, table cells, quotes)
 * rather than every leaf text node on the page — nav links, buttons, and short UI labels aren't
 * sentences, and running a grammar/readability check over them produces mostly noise (fragments
 * read as "bad grammar" to a rule-based checker even when they're perfectly normal UI copy). */
function extractFlowingText($: cheerio.CheerioAPI): string {
  const parts: string[] = [];
  $("p, li, blockquote, td, dd").each((_, el) => {
    const text = $(el).text().trim().replace(/\s+/g, " ");
    if (text.length >= 20) parts.push(text);
  });
  return parts.join(" ");
}

function findingBase(context: EngineContext): Pick<EngineFinding, "pageUrl" | "engine" | "location"> {
  // Location not yet adopted by this Engine (docs/03: migrated one capability at a time — Links
  // & Images first; Content & Grammar is a later phase).
  return { pageUrl: context.page!.url, engine: "CONTENT", location: null };
}

/**
 * Mode 1: for each content-sheet row mapped to this page, finds the best-matching DOM element
 * (by text similarity) and raises a finding when nothing clears `CONTENT_MATCH_THRESHOLD`. No
 * finding is raised for rows that match — matching content isn't evidence of a problem.
 */
function runContentSheetChecks(context: EngineContext, domElements: { text: string }[]): EngineFinding[] {
  const rows = context.configuration.contentSheetRows as ContentSheetRow[] | null;
  if (!rows || rows.length === 0) return [];

  const pageRows = rows.filter((row) => matchesPagePath(row.page, context.page!.url));
  const findings: EngineFinding[] = [];

  for (const row of pageRows) {
    let best: { text: string; score: number } | null = null;
    for (const el of domElements) {
      const score = textSimilarity(row.expectedText, el.text);
      if (!best || score > best.score) best = { text: el.text, score };
    }
    if (best && best.score >= CONTENT_MATCH_THRESHOLD) continue; // matches — nothing to report.

    const notFound = !best || best.score < NOT_FOUND_THRESHOLD;
    const label = row.element ? ` (${row.element})` : "";
    findings.push({
      ...findingBase(context),
      severity: notFound ? "HIGH" : "MEDIUM",
      confidence: notFound ? 0.95 : 0.85,
      category: notFound ? "Missing Expected Content" : "Content Mismatch",
      title: notFound
        ? `Expected content not found on this page${label}`
        : `Content differs from the approved content sheet${label}`,
      description: notFound
        ? `The approved text "${row.expectedText}" was not found anywhere on this page.`
        : `The approved text "${row.expectedText}" most closely matches "${best!.text}" on this page (${Math.round(best!.score * 100)}% similar), below the ${Math.round(CONTENT_MATCH_THRESHOLD * 100)}% threshold for a match.`,
      expectedResult: row.expectedText,
      actualResult: best ? best.text : "(not found on page)",
      businessImpact:
        "Content shown to real users doesn't match the approved content sheet, risking incorrect or unapproved messaging going live.",
      suggestedResolution:
        "Update the page content to match the approved content sheet, or update the content sheet if this change was intentional.",
      evidence: [],
    });
  }

  return findings;
}

export const contentEngine: Engine = {
  id: "content-engine",
  name: "CONTENT",
  version: "0.3.0",
  description:
    "Deterministic content checks: placeholder text/empty headings/missing page title/grammar-spelling (LanguageTool)/Flesch readability (Mode 2, always on), plus Content Sheet -> Website comparison when a parsed Content Sheet is available (Mode 1, docs/04).",
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

    const flowingText = extractFlowingText($);

    const grammarIssues = await checkGrammar(flowingText);
    if (grammarIssues.length > 0) {
      const examples = grammarIssues
        .slice(0, 5)
        .map((i) => `"${i.snippet}" — ${i.shortMessage}${i.replacements.length > 0 ? ` (suggest: ${i.replacements.join(", ")})` : ""}`)
        .join("; ");
      findings.push({
        ...findingBase(context),
        severity: "MEDIUM",
        confidence: 0.85,
        category: "Grammar/Spelling Issues",
        title: `${grammarIssues.length} grammar/spelling issue${grammarIssues.length > 1 ? "s" : ""} found`,
        description: `Found ${grammarIssues.length} grammar/spelling issue(s) in this page's content: ${examples}.`,
        expectedResult: "Page content is free of grammar and spelling errors.",
        actualResult: `${grammarIssues.length} issue(s) detected: ${examples}.`,
        businessImpact: "Grammar and spelling mistakes in published content look unprofessional and undermine trust with real users.",
        suggestedResolution: "Review and correct the flagged text using the suggested replacements where applicable.",
        evidence: [],
      });
    }

    const readability = computeReadability(flowingText);
    if (readability && readability.wordCount >= MIN_WORDS_FOR_READABILITY && readability.score < READABILITY_SCORE_CUTOFF) {
      findings.push({
        ...findingBase(context),
        severity: "LOW",
        confidence: 0.85,
        category: "Low Readability Score",
        title: `Page content scores as "${readability.grade}" to read (Flesch score ${readability.score})`,
        description: `This page's flowing text (${readability.wordCount} words across ${readability.sentenceCount} sentences) scores ${readability.score}/100 on the Flesch Reading Ease scale, graded "${readability.grade}".`,
        expectedResult: "Page content is reasonably easy to read for a general audience (Flesch score 60+).",
        actualResult: `Flesch Reading Ease score: ${readability.score} ("${readability.grade}").`,
        businessImpact: "Dense, hard-to-read content increases bounce rate and reduces comprehension for the average visitor.",
        suggestedResolution: "Shorten sentences and prefer simpler, shorter words where possible to improve readability.",
        evidence: [],
      });
    }

    findings.push(...runContentSheetChecks(context, artifacts.domElements));

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
