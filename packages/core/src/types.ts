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
  domHtml: string;
  consoleMessages: string[];
  networkErrors: string[];
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
  [key: string]: unknown;
};

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
