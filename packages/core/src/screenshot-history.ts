/**
 * Durable, Evidence-independent screenshot history (docs/04 Visual Engine: "Reference Screenshot
 * → Current Screenshot → Pixel Comparison"). A page's screenshot only becomes an `Evidence` row
 * if some Validation engine attaches it to a Finding — a page with zero findings in a given audit
 * still needs its screenshot discoverable later as a future audit's comparison baseline, so this
 * is recorded independently by the Browser Engine every time, not derived from Evidence.
 */
import { prisma } from "@tentwenty/db";

export async function recordPageScreenshot(
  projectId: string,
  auditId: string,
  pageUrl: string,
  screenshotPath: string
): Promise<void> {
  await prisma.pageScreenshot.create({ data: { projectId, auditId, pageUrl, screenshotPath } });
}

/** The most recent screenshot for this project/page from a *different* (earlier) audit — the
 * Visual Engine's regression-comparison baseline. `null` if this page has never been audited
 * before (nothing to compare against yet). */
export async function getPreviousScreenshotPath(
  projectId: string,
  auditId: string,
  pageUrl: string
): Promise<string | null> {
  const prev = await prisma.pageScreenshot.findFirst({
    where: { projectId, pageUrl, auditId: { not: auditId } },
    orderBy: { capturedAt: "desc" },
  });
  return prev?.screenshotPath ?? null;
}
