import { prisma } from "@tentwenty/db";
import { getConfiguredAIProvider, registerEngine, type Engine, type EngineContext } from "@tentwenty/core";

export const aiEngine: Engine = {
  id: "ai-engine",
  name: "AI",
  version: "0.1.0",
  description:
    "Generates human-readable explanations for findings and an executive summary for the audit, strictly after every other engine has decided the results — never itself, docs/06.",
  // Needs blended confidence scores to exist first (docs/06 pipeline: Confidence -> Evidence -> AI).
  dependencies: ["confidence-engine"],
  supportedValidationTypes: [],
  scope: "audit",

  async initialize(context: EngineContext) {
    const provider = await getConfiguredAIProvider();
    if (!provider) {
      // docs/06 "If a provider is unavailable: continue the audit, generate the report without
      // AI content, log the failure." Not configuring one at all is the same case.
      console.warn(`AI Engine: no provider configured for audit ${context.auditId} — skipping AI content.`);
      return;
    }

    const findings = await prisma.finding.findMany({
      where: { auditId: context.auditId },
      include: { evidence: true },
    });

    for (const finding of findings) {
      try {
        const explanation = await provider.explainFinding({
          title: finding.title,
          category: finding.category,
          severity: finding.severity,
          confidence: finding.confidence,
          description: finding.description,
          expectedResult: finding.expectedResult,
          actualResult: finding.actualResult,
          businessImpact: finding.businessImpact,
          suggestedResolution: finding.suggestedResolution,
          evidenceTypes: finding.evidence.map((e) => e.type),
        });
        await prisma.finding.update({ where: { id: finding.id }, data: { aiExplanation: explanation } });
      } catch (err) {
        // One finding's explanation failing (rate limit, transient provider error) doesn't
        // affect the rest — same partial-failure tolerance as everywhere else (docs/03).
        console.error(`AI Engine: failed to explain finding ${finding.id}: ${(err as Error).message}`);
      }
    }

    if (findings.length > 0) {
      try {
        const audit = await prisma.audit.findUniqueOrThrow({
          where: { id: context.auditId },
          include: { project: true, environment: true },
        });
        const findingsBySeverity: Record<string, number> = {};
        const findingsByEngine: Record<string, number> = {};
        for (const f of findings) {
          findingsBySeverity[f.severity] = (findingsBySeverity[f.severity] ?? 0) + 1;
          findingsByEngine[f.engine] = (findingsByEngine[f.engine] ?? 0) + 1;
        }

        const summary = await provider.summarizeAudit({
          projectName: audit.project.name,
          environmentName: audit.environment.name,
          totalFindings: findings.length,
          findingsBySeverity,
          findingsByEngine,
        });
        await prisma.audit.update({ where: { id: context.auditId }, data: { aiExecutiveSummary: summary } });
      } catch (err) {
        console.error(`AI Engine: failed to summarize audit ${context.auditId}: ${(err as Error).message}`);
      }
    }
  },

  async validate() {
    return []; // Never creates findings (docs/06 "What AI Must Never Do: create new findings").
  },

  async collectEvidence(_context, findings) {
    return findings;
  },

  async calculateConfidence() {
    return 1; // N/A — this engine never produces its own findings to score.
  },

  async cleanup() {
    // Nothing to tear down.
  },
};

registerEngine(aiEngine);
