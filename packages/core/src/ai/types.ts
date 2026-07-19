/**
 * Provider-agnostic AI interface (docs/06 "Supported Providers": "Provider-agnostic via a common
 * interface... switching providers should require only configuration changes, never code changes
 * to any Engine"). The AI Engine only ever talks to `AIProvider` — never to a specific vendor SDK
 * directly — so adding OpenAI/Gemini later means one new file implementing this interface, not a
 * change to `packages/engines/ai-engine`.
 */

/** Structured, already-decided data only (docs/06 "AI Input") — no live application access, no
 * raw evidence file content (screenshots, HTML). `evidenceTypes` names what evidence exists
 * ("SCREENSHOT", "CONSOLE_LOGS", ...), not its content. */
export type FindingExplanationInput = {
  title: string;
  category: string | null;
  severity: string;
  confidence: number;
  description: string;
  expectedResult: string;
  actualResult: string;
  businessImpact: string;
  suggestedResolution: string;
  evidenceTypes: string[];
};

export type AuditSummaryInput = {
  projectName: string;
  environmentName: string;
  totalFindings: number;
  findingsBySeverity: Record<string, number>;
  findingsByEngine: Record<string, number>;
};

export interface AIProvider {
  readonly name: string;
  /** A concise, human-readable explanation of one finding — docs/06 "explain findings, improve
   * readability, suggest possible fixes." Never alters the finding itself. */
  explainFinding(input: FindingExplanationInput): Promise<string>;
  /** A short executive summary of the whole audit — docs/06 "generate executive summaries." */
  summarizeAudit(input: AuditSummaryInput): Promise<string>;
}
