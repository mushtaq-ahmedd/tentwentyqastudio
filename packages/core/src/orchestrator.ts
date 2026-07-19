import { prisma } from "@tentwenty/db";
import { engineRegistry } from "./registry";
import { TransientEngineError, type DiscoveredPage, type Engine, type EngineContext, type EngineFinding } from "./types";

/** docs/03 Retry policy: transient failures only, max 2 attempts. */
const MAX_RETRIES = 2;

/**
 * Runs every engine that's both (a) registered in this process and (b) has a WAITING
 * EngineResult row on this audit (i.e. was selected at audit-start time — see
 * apps/web/src/lib/api/audits.ts's startAudit). Engines with no implementation yet are left
 * WAITING — the audit honestly stays RUNNING rather than faking a COMPLETED pipeline that
 * didn't actually validate anything (CLAUDE.md: "accuracy before automation").
 *
 * Runs in-process rather than via a BullMQ/Redis job queue (docs/08's eventual target) — no
 * queue is provisioned yet, and for a single Discovery crawl this is a fine interim
 * simplification. Flagging per docs/10, not silently deviating: revisit once real Browser-driven
 * engines make a single request-lifetime execution impractical.
 */
export async function runAudit(auditId: string): Promise<void> {
  const audit = await prisma.audit.findUnique({
    where: { id: auditId },
    include: { environment: true, engineResults: true },
  });
  if (!audit) throw new Error(`Audit ${auditId} not found.`);

  await prisma.audit.update({ where: { id: auditId }, data: { status: "RUNNING" } });

  const executionOrder = engineRegistry.resolveExecutionOrder();
  const totalForThisAudit = audit.engineResults.length;
  const runnable = executionOrder.filter((engine) =>
    audit.engineResults.some((er) => er.engine === engine.name && er.status === "WAITING")
  );

  const context: EngineContext = {
    auditId: audit.id,
    projectId: audit.projectId,
    environment: {
      id: audit.environment.id,
      name: audit.environment.name,
      url: audit.environment.url,
      loginUrl: audit.environment.loginUrl,
    },
    configuration: {},
    sharedResources: {},
  };

  let pagesPersisted = false;

  for (const engine of runnable) {
    const engineResultRow = await prisma.engineResult.findFirst({
      where: { auditId, engine: engine.name, status: "WAITING" },
    });
    if (!engineResultRow) continue; // already handled (defensive — shouldn't happen)

    await runSingleEngine(engine, engineResultRow.id, context, audit.id, audit.projectId);

    if (!pagesPersisted && context.sharedResources.pages?.length) {
      await persistDiscoveredPages(audit.id, context.sharedResources.pages);
      pagesPersisted = true;
    }

    const completedCount = await prisma.engineResult.count({
      where: { auditId, status: { in: ["COMPLETED", "FAILED"] } },
    });
    await prisma.audit.update({
      where: { id: auditId },
      data: { progressPercent: Math.round((completedCount / (totalForThisAudit || 1)) * 100) },
    });
  }

  const remainingWaiting = await prisma.engineResult.count({ where: { auditId, status: "WAITING" } });
  const anyFailed = await prisma.engineResult.count({ where: { auditId, status: "FAILED" } });

  if (remainingWaiting > 0) {
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        currentEngine: null,
        currentActivity: `Waiting on ${remainingWaiting} engine(s) not yet implemented`,
      },
    });
  } else {
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        status: anyFailed > 0 ? "FAILED" : "COMPLETED",
        endedAt: new Date(),
        currentEngine: null,
        currentActivity: null,
        progressPercent: 100,
      },
    });
  }
}

async function runSingleEngine(
  engine: Engine,
  engineResultId: string,
  context: EngineContext,
  auditId: string,
  projectId: string
): Promise<void> {
  await prisma.engineResult.update({ where: { id: engineResultId }, data: { status: "RUNNING" } });
  await prisma.audit.update({
    where: { id: auditId },
    data: { currentEngine: engine.name, currentActivity: `Running ${engine.name}` },
  });
  engineRegistry.setHealth(engine.id, "Running");

  const startedAt = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    try {
      await engine.initialize(context);
      let findings = await engine.validate(context);
      findings = await engine.collectEvidence(context, findings);
      for (const finding of findings) {
        finding.confidence = await engine.calculateConfidence(finding, context);
      }
      await engine.cleanup(context);

      const durationSeconds = Math.round((Date.now() - startedAt) / 1000);
      await persistFindings(auditId, projectId, findings);
      await prisma.engineResult.update({
        where: { id: engineResultId },
        data: { status: "COMPLETED", durationSeconds, findingsCount: findings.length },
      });
      engineRegistry.setHealth(engine.id, "Healthy");
      return;
    } catch (err) {
      lastError = err;
      const isTransient = err instanceof TransientEngineError;
      // docs/03: never retry permanent failures; retry transient ones up to MAX_RETRIES.
      if (!isTransient || attempt > MAX_RETRIES) break;
    }
  }

  console.error(`Engine "${engine.id}" failed for audit ${auditId}:`, lastError);
  await prisma.engineResult.update({
    where: { id: engineResultId },
    data: {
      status: "FAILED",
      errorCount: { increment: 1 },
      durationSeconds: Math.round((Date.now() - startedAt) / 1000),
    },
  });
  engineRegistry.setHealth(engine.id, "Failed");
}

async function persistDiscoveredPages(auditId: string, pages: DiscoveredPage[]): Promise<void> {
  await prisma.page.createMany({
    data: pages.map((p) => ({ auditId, url: p.url, name: p.name, status: "VALIDATED" as const })),
    skipDuplicates: true,
  });
}

async function persistFindings(auditId: string, projectId: string, findings: EngineFinding[]): Promise<void> {
  for (const finding of findings) {
    const page = await prisma.page.findFirst({ where: { auditId, url: finding.pageUrl } });
    if (!page) {
      console.warn(`No Page row for URL "${finding.pageUrl}" on audit ${auditId} — dropping finding "${finding.title}".`);
      continue;
    }
    await prisma.finding.create({
      data: {
        auditId,
        pageId: page.id,
        projectId,
        engine: finding.engine,
        severity: finding.severity,
        confidence: finding.confidence,
        category: finding.category,
        title: finding.title,
        description: finding.description,
        expectedResult: finding.expectedResult,
        actualResult: finding.actualResult,
        businessImpact: finding.businessImpact,
        suggestedResolution: finding.suggestedResolution,
        evidence: {
          create: finding.evidence.map((e) => ({ type: e.type, storagePath: e.content })),
        },
      },
    });
  }
}
