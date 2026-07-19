/**
 * Business-capability validation-type language — docs/09-dashboard-ux.md "Audit Center".
 * Accessibility Testing intentionally excluded: out of scope until V2/V3 per CLAUDE.md's
 * V1 Scope Fence, even though the HTML prototype included it.
 */
export const VALIDATION_TYPES = [
  "UI Validation",
  "Figma Comparison",
  "Content Validation",
  "Grammar Validation",
  "Functional Validation",
] as const;

export type ValidationType = (typeof VALIDATION_TYPES)[number];

/**
 * All 15 engines per docs/03's Engine Categories table — matches the Prisma `EngineName` enum
 * 1:1 so API responses map cleanly. Note "Grammar Validation" is deliberately absent here: per
 * docs/04, grammar checking is the Content Engine's second mode, not a separate engine — it's
 * only a ValidationType (above), attributed to the CONTENT engine when it produces findings.
 */
export const ENGINES = [
  "Discovery",
  "Browser",
  "Figma",
  "Element Matching",
  "UI Validation",
  "Visual",
  "Content",
  "Functional",
  "Accessibility",
  "Performance",
  "Security",
  "Confidence",
  "Evidence",
  "AI",
  "Report Generation",
] as const;

export type EngineName = (typeof ENGINES)[number];

/** Engines actually active in V1 (per CLAUDE.md's Scope Fence) — the rest exist in the type for
 * forward-compatibility but won't appear in real Engine Health/Results data yet. */
export const V1_ENGINES: EngineName[] = [
  "Discovery",
  "Figma",
  "UI Validation",
  "Content",
  "Functional",
  "Report Generation",
];

export type EngineStatus = "waiting" | "running" | "completed" | "failed";

export type Severity = "critical" | "high" | "medium" | "low";

/** Roles — docs/05-database-and-api.md "Authentication & Authorization". */
export const USER_ROLES = ["Administrator", "QA Lead", "QA Engineer", "Viewer"] as const;
export type UserRole = (typeof USER_ROLES)[number];
