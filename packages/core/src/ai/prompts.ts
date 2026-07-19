/**
 * Prompt templates — version-controlled alongside the application code, not hand-edited ad hoc
 * in production (docs/06 "Prompt Strategy & Rules"). Shared across every provider implementation
 * so the hallucination-prevention rules apply identically regardless of which vendor is
 * configured.
 */
import type { AuditSummaryInput, FindingExplanationInput } from "./types";

/** Applies to every AI call this engine makes — docs/06 "Prompts must instruct the model to:
 * stay concise, avoid assumptions, use only provided evidence, never invent missing information,
 * clearly state uncertainty when evidence is insufficient." */
export const SYSTEM_PROMPT = `You are the AI Engine of tentwenty QA Studio, a QA automation platform.

A deterministic validation engine has already decided the finding you're given is real — your only job is to explain it clearly for a human reader. You do not judge, verify, or second-guess it.

Rules, always:
1. Be concise.
2. Use ONLY the information provided in the user message. Never invent root causes, technical details, or context that isn't given.
3. If the given information is insufficient to explain something with confidence, say so explicitly instead of guessing.
4. Never state or imply your own pass/fail judgment, severity assessment, or confidence score — those are already decided and are not yours to weigh in on.
5. Never claim to have inspected the live application — you only see the structured data given to you.`;

export function findingExplanationPrompt(input: FindingExplanationInput): string {
  return [
    "Explain the following QA finding in 2-4 sentences for someone who did not run the audit themselves.",
    "",
    `Title: ${input.title}`,
    `Category: ${input.category ?? "(none)"}`,
    `Severity: ${input.severity}`,
    `Confidence: ${Math.round(input.confidence * 100)}%`,
    `Description: ${input.description}`,
    `Expected result: ${input.expectedResult}`,
    `Actual result: ${input.actualResult}`,
    `Business impact (as assessed by the engine): ${input.businessImpact}`,
    `Suggested resolution (as assessed by the engine): ${input.suggestedResolution}`,
    `Evidence captured: ${input.evidenceTypes.length > 0 ? input.evidenceTypes.join(", ") : "(none)"}`,
  ].join("\n");
}

export function auditSummaryPrompt(input: AuditSummaryInput): string {
  const bySeverity = Object.entries(input.findingsBySeverity)
    .map(([sev, count]) => `${sev}: ${count}`)
    .join(", ");
  const byEngine = Object.entries(input.findingsByEngine)
    .map(([engine, count]) => `${engine}: ${count}`)
    .join(", ");

  return [
    "Write a concise executive summary (3-5 sentences) of this QA audit for a non-technical stakeholder.",
    "Use ONLY the statistics given below — do not invent specific findings, page names, or details beyond what's provided.",
    "",
    `Project: ${input.projectName}`,
    `Environment: ${input.environmentName}`,
    `Total findings: ${input.totalFindings}`,
    `Findings by severity: ${bySeverity || "(none)"}`,
    `Findings by engine: ${byEngine || "(none)"}`,
  ].join("\n");
}
