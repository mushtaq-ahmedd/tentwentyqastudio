/**
 * Mirrors the mock data in apps/web/src/lib/mock/*.ts so the real DB starts from the same
 * demo state the frontend was built and screenshotted against.
 */
import { PrismaClient, ValidationType, EngineName, EngineStatus, Severity, EvidenceType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding…");

  const mushtaq = await prisma.user.upsert({
    where: { email: "mushtaq@tentwenty.me" },
    update: {},
    create: {
      name: "Mushtaq Ahmed",
      email: "mushtaq@tentwenty.me",
      role: "ADMINISTRATOR",
      status: "ACTIVE",
      lastActiveAt: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { email: "anika@tentwenty.me" },
    update: {},
    create: { name: "Anika Suri", email: "anika@tentwenty.me", role: "QA_LEAD", status: "ACTIVE" },
  });

  const jordan = await prisma.user.upsert({
    where: { email: "jordan@tentwenty.me" },
    update: {},
    create: { name: "Jordan Reyes", email: "jordan@tentwenty.me", role: "QA_ENGINEER", status: "ACTIVE" },
  });

  await prisma.user.upsert({
    where: { email: "sam@tentwenty.me" },
    update: {},
    create: { name: "Sam Patel", email: "sam@tentwenty.me", role: "VIEWER", status: "DISABLED" },
  });

  const acme = await prisma.project.create({
    data: {
      name: "Acme Corp Website",
      description: "Marketing + e-commerce site for Acme Corp, covering homepage, pricing, and checkout.",
      clientName: "Acme Corp",
      baseUrl: "acmecorp.com",
      figmaFileUrl: "https://figma.com/design/acme-homepage",
      status: "READY_WITH_WARNINGS",
      ownerId: jordan.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Northwind Portal",
      clientName: "Northwind Traders",
      baseUrl: "portal.northwind.com",
      status: "NOT_READY",
      ownerId: jordan.id,
    },
  });

  await prisma.project.create({
    data: {
      name: "Fenwick Docs",
      clientName: "Fenwick",
      baseUrl: "docs.fenwick.dev",
      status: "READY",
      ownerId: mushtaq.id,
    },
  });

  const qaEnv = await prisma.environment.create({
    data: { projectId: acme.id, name: "QA", url: "qa.acmecorp.com", authStatus: "VERIFIED" },
  });
  await prisma.environment.createMany({
    data: [
      { projectId: acme.id, name: "Development", url: "dev.acmecorp.com", authStatus: "VERIFIED" },
      { projectId: acme.id, name: "Staging", url: "staging.acmecorp.com", authStatus: "VERIFIED" },
      { projectId: acme.id, name: "Production", url: "acmecorp.com", authStatus: "VERIFIED" },
    ],
  });

  await prisma.knowledgeSource.createMany({
    data: [
      { projectId: acme.id, name: "Requirements.pdf", type: "REQUIREMENTS_DOCUMENT", uploadedBy: "J. Reyes", status: "PROCESSED" },
      { projectId: acme.id, name: "Checkout_Test_Cases.xlsx", type: "TEST_CASES", uploadedBy: "A. Suri", status: "PROCESSED" },
      { projectId: acme.id, name: "Homepage.fig", type: "FIGMA_DESIGN", uploadedBy: "A. Suri", status: "PROCESSED" },
    ],
  });

  const audit = await prisma.audit.create({
    data: {
      projectId: acme.id,
      environmentId: qaEnv.id,
      status: "RUNNING",
      validationTypes: [ValidationType.UI_VALIDATION, ValidationType.FIGMA_COMPARISON, ValidationType.GRAMMAR_VALIDATION],
      startedById: jordan.id,
      currentEngine: EngineName.CONTENT,
      currentActivity: "Comparing homepage with Figma...",
      progressPercent: 72,
    },
  });

  await prisma.engineResult.createMany({
    data: [
      { auditId: audit.id, engine: EngineName.DISCOVERY, status: EngineStatus.COMPLETED, durationSeconds: 42 },
      { auditId: audit.id, engine: EngineName.UI_VALIDATION, status: EngineStatus.COMPLETED, durationSeconds: 63, findingsCount: 1 },
      // "Grammar Validation" is a user-facing ValidationType (docs/09), not a separate Engine —
      // the Content Engine handles it as its second mode (docs/04 "Content Engine").
      { auditId: audit.id, engine: EngineName.CONTENT, status: EngineStatus.RUNNING },
      { auditId: audit.id, engine: EngineName.REPORT, status: EngineStatus.WAITING },
    ],
  });

  const homepage = await prisma.page.create({
    data: { auditId: audit.id, url: "/", name: "Homepage", status: "VALIDATED" },
  });

  const finding = await prisma.finding.create({
    data: {
      auditId: audit.id,
      pageId: homepage.id,
      projectId: acme.id,
      engine: EngineName.UI_VALIDATION,
      severity: Severity.CRITICAL,
      confidence: 0.99,
      title: "Missing CTA button",
      expectedResult: "Primary CTA button should be visible below the hero section.",
      actualResult: "Primary CTA button is missing from the homepage.",
      businessImpact: "Users may not be able to proceed to the primary conversion flow.",
      suggestedResolution: "Verify that the CTA component is rendered correctly and matches the approved design.",
      status: "NEW",
    },
  });

  await prisma.evidence.create({
    data: { findingId: finding.id, type: EvidenceType.SCREENSHOT, storagePath: "seed/placeholder-screenshot.png" },
  });

  await prisma.platformSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1 },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
