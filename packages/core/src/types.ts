/**
 * The standard Engine contract — docs/03-system-and-engine-architecture.md "Standard Engine
 * Interface" and "Engine Input/Output". Every Engine package implements `Engine` exactly as
 * defined here; no custom shapes anywhere (docs/03 is explicit: "no exceptions").
 */
import type { EngineName, EvidenceType, Severity, ValidationType } from "@tentwenty/db";

export type DiscoveredPage = {
  url: string;
  name: string;
};

/** A pixel-space bounding box from a real layout pass (`getBoundingClientRect()`) — shared by
 * every "where on the page is this" concept (Location, PageLink/PageImage, DomElement). */
export type BoundingBox = { x: number; y: number; width: number; height: number };

/**
 * A precise, mandatory pointer to *where on the page* an issue is — CLAUDE.md's Location
 * non-negotiable. Captured by the detecting Engine at the moment it finds the issue (it already
 * has this data from the same DOM pass); never reconstructed or guessed later by anything
 * downstream, including the AI Engine (docs/06's location rule). At least one of `selector`/
 * `textSnippet`/`boundingBox` should be non-null — which one(s) make sense depends on the finding
 * type (a broken link has a selector + bounding box; a grammar mistake has a text snippet).
 */
export type FindingLocation = {
  /** CSS selector (or a best-effort element path) pointing at the specific element. */
  selector: string | null;
  /** The exact text snippet the finding is about, for content/grammar-type findings. */
  textSnippet: string | null;
  /** Where to draw the highlight box on the page screenshot — null only when the element has no
   * visual position (e.g. `display: none`), in which case no highlighted screenshot is possible. */
  boundingBox: BoundingBox | null;
};

/**
 * What the Browser Engine collects for one page — docs/03's diagram lists Console Monitoring,
 * Network Monitoring, and Screenshot Capture as per-page collection activities. `*Path` fields
 * are already-uploaded object storage paths (docs/05); the `*Text` fields are the same content
 * kept in memory for the current run so same-process Validation engines can scan it without a
 * redundant storage round-trip.
 */
export type BrowserPageArtifacts = {
  screenshotPath: string;
  domSnapshotPath: string;
  consoleLogPath: string;
  networkLogPath: string;
  /** JSON array of `DomElement`s (including each one's `style` summary) — docs/04 Browser
   * Engine's "extract computed CSS", uploaded as evidence for future typography/color checks. */
  cssSnapshotPath: string;
  domHtml: string;
  consoleMessages: string[];
  networkErrors: string[];
  /** Real rendered elements (via `getBoundingClientRect()`), for the Element Matching Engine. */
  domElements: DomElement[];
  /** Every `<a href>` on the rendered page, resolved to an absolute URL — the Links & Images
   * capability's real input (replaces Discovery's old static-HTML link parsing; see the Links &
   * Images redesign note in docs/03). */
  links: PageLink[];
  /** Every `<img src>` on the rendered page, resolved to an absolute URL. */
  images: PageImage[];
};

/** One `<a href>` found on a real rendered page — resolved URL, a best-effort CSS selector, its
 * visible text (for a human-readable finding), and its on-page bounding box (null if the element
 * has no visual position, e.g. `display: none`). */
export type PageLink = {
  url: string;
  selector: string;
  text: string;
  boundingBox: BoundingBox | null;
};

/** One `<img src>` found on a real rendered page — same shape as `PageLink`, with `alt` text
 * instead of link text. */
export type PageImage = {
  url: string;
  selector: string;
  alt: string;
  boundingBox: BoundingBox | null;
};

/**
 * One top-level frame or component extracted from a Figma file (docs/04 Figma Engine: "extract
 * frames/components, prepare design data for comparison"). Only top-level nodes within each
 * Figma "page" (a CANVAS node — Figma's own term, unrelated to our `Page`/website-page model) are
 * captured here; text-bearing descendants used for matching are `FigmaElement`, below.
 */
export type FigmaFrame = {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox: { x: number; y: number; width: number; height: number } | null;
  /** The Figma CANVAS (page) this frame belongs to — distinct from our own Page model. */
  figmaPageId: string;
  figmaPageName: string;
};

/**
 * One text-bearing node found anywhere inside a Figma frame (docs/04 Element Matching: "text" is
 * the first/primary matching signal). Only `TEXT` nodes with non-empty `characters` are captured
 * — see the Figma Engine README for why position/size/visual-similarity signals aren't attempted
 * yet. Recursion depth and total element count are capped (see `figma-cache.ts`) so a large,
 * deeply-nested file can't produce unbounded data.
 */
export type FigmaElement = {
  id: string;
  name: string;
  type: string;
  text: string;
  figmaPageId: string;
  figmaPageName: string;
  parentFrameId: string;
  parentFrameName: string;
};

/** A curated subset of `getComputedStyle()` — the visual properties relevant to typography/color
 * checks (docs/04 Browser Engine: "extract computed CSS"). Not the full computed style object
 * (hundreds of properties per element) — see the Browser Engine README for why. */
export type ComputedStyleSummary = {
  color: string;
  backgroundColor: string;
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  display: string;
};

/** One rendered DOM element the Browser Engine captured as a text-matching candidate — real
 * layout data from `getBoundingClientRect()` inside the actual browser, not parsed from static
 * HTML (position/size can't be known without a real layout pass). */
export type DomElement = {
  tag: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: ComputedStyleSummary;
};

/** One deterministic step in a recorded/authored TestFlow (docs/02 V2 "Workflow Validation",
 * pulled forward — see packages/engines/workflow-engine). Mirrors the `FlowStep` Prisma model
 * field-for-field; kept as a plain type here (rather than importing the Prisma model type
 * directly) since the Orchestrator resolves this once and hands it through `EngineContext
 * .configuration`, same pattern as `ContentSheetRow`. */
export type WorkflowFlowStep = {
  order: number;
  action: "NAVIGATE" | "CLICK" | "FILL" | "PRESS_KEY" | "ASSERT_VISIBLE" | "ASSERT_TEXT" | "ASSERT_URL";
  selector: string | null;
  value: string | null;
};

/** One recorded/authored flow, with its steps already ordered — resolved once by the
 * Orchestrator (`context.configuration.testFlows`), never queried directly by the Workflow
 * Engine itself (docs/03: engines read only from the shared input the Core Platform provides). */
export type WorkflowTestFlow = {
  id: string;
  name: string;
  startUrl: string;
  steps: WorkflowFlowStep[];
};

/**
 * Data that Collection engines (Discovery/Browser/Figma) hand forward to later engines —
 * docs/03 "Engines must not request data directly from other Engines — only from the shared
 * input the Core Platform provides." Extended as Browser/Figma engines are built.
 */
export type SharedResources = {
  pages?: DiscoveredPage[];
  /** Keyed by page URL — populated by the Browser Engine, read by page-scoped Validation engines. */
  pageArtifacts?: Record<string, BrowserPageArtifacts>;
  /** Populated by the Figma Engine — read by the Element Matching Engine. */
  figmaFrames?: FigmaFrame[];
  figmaElements?: FigmaElement[];
  /** Populated by the Element Matching Engine — read by the (not yet built) UI Validation Engine. */
  elementMatches?: ElementMatch[];
  [key: string]: unknown;
};

/** One Figma element matched (or not) to a rendered DOM element on a specific page — the output
 * of the Element Matching Engine, docs/04's prerequisite step "before comparing pixels or
 * attributes." `matched: false` means no DOM element scored above the confidence threshold — not
 * itself a Finding (Element Matching prepares data, it doesn't judge, docs/03); the not-yet-built
 * UI Validation Engine decides what an unmatched element means. */
export type ElementMatch = {
  pageUrl: string;
  figmaElementId: string;
  figmaElementName: string;
  figmaText: string;
} & (
  | { matched: true; domText: string; domTag: string; confidence: number }
  | { matched: false }
);

/** Engine Input (docs/03) — the common shape every Engine receives. */
export type EngineContext = {
  auditId: string;
  projectId: string;
  environment: {
    id: string;
    name: string;
    url: string;
    loginUrl: string | null;
  };
  /** Present for per-page Validation Engine runs; absent for audit-level Collection engines
   * (Discovery runs once per audit, not once per page — there are no pages yet). */
  page?: {
    id: string;
    url: string;
    name: string;
  };
  configuration: Record<string, unknown>;
  sharedResources: SharedResources;
};

export type EngineEvidence = {
  type: EvidenceType;
  /** A real object-storage path (docs/05) — already uploaded to the `evidence` bucket via
   * `uploadEvidence()` (packages/core/src/storage.ts) by the time a Finding references it. Never
   * raw content inline. */
  content: string;
};

/**
 * Matches docs/03's platform-wide Finding Schema plus the documented `businessImpact`
 * extension (see docs/03's "Platform extension" note). No `id`/`createdAt`/`pageId` yet — the
 * Orchestrator assigns those on persist, once it knows which real Page row this belongs to.
 */
export type EngineFinding = {
  pageUrl: string;
  engine: EngineName;
  severity: Severity;
  /** Each Engine's own initial score (docs/03 "Confidence Model") — not yet blended into a
   * final score, since the Confidence Engine doesn't exist yet (flagging, not faking it). */
  confidence: number;
  category?: string;
  title: string;
  description: string;
  expectedResult: string;
  actualResult: string;
  businessImpact: string;
  suggestedResolution: string;
  /** Precise on-page pointer — mandatory for any engine that's adopted the Location rule (see
   * `FindingLocation` above); `null` for engines not yet migrated to it (docs/03: migrated
   * capability-by-capability, not retrofitted onto every engine at once). */
  location: FindingLocation | null;
  evidence: EngineEvidence[];
};

/** Thrown by an Engine to signal a transient failure — docs/03's Retry policy (max 2 attempts:
 * browser crash, timeout, temporary network issue). Any other thrown error is treated as
 * permanent (invalid config, auth failure, etc.) and never retried. */
export class TransientEngineError extends Error {}

/** Standard Engine Interface (docs/03) — every Engine implements exactly these five methods. */
export interface Engine {
  readonly id: string;
  readonly name: EngineName;
  readonly version: string;
  readonly description: string;
  /** Other Engine IDs that must complete first (docs/03 "Execution Strategy" dependency chain). */
  readonly dependencies: string[];
  readonly supportedValidationTypes: ValidationType[];
  /**
   * "audit" — runs once for the whole audit before any page exists yet (Discovery, Figma).
   * "page" — runs once per discovered page, with `context.page` set (Browser, UI, Content,
   * Functional, ...) — docs/03: "Each page of an audit is also an independent execution unit."
   */
  readonly scope: "audit" | "page";

  /**
   * Collection engines (Discovery/Browser/Figma) do their real gathering work here, mutating
   * `context.sharedResources` so later engines can use it — they "gather data only, never
   * judge" (docs/03 Engine Categories). Validation engines use this for lightweight setup only.
   */
  initialize(context: EngineContext): Promise<void>;

  /**
   * Validation engines do their real judgment work here and return Findings. Collection
   * engines always return `[]` — they never produce findings.
   */
  validate(context: EngineContext): Promise<EngineFinding[]>;

  /** Enriches each finding's `evidence` array. Returns the same findings, evidence populated. */
  collectEvidence(context: EngineContext, findings: EngineFinding[]): Promise<EngineFinding[]>;

  /** This Engine's own initial confidence score for one finding (0–1) — see the type-level note
   * on `EngineFinding.confidence` above. */
  calculateConfidence(finding: EngineFinding, context: EngineContext): Promise<number>;

  cleanup(context: EngineContext): Promise<void>;
}
