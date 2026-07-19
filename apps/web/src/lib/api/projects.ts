import { prisma } from "@tentwenty/db";
import type { ApiResponse, Project } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
import { toProject, type ProjectWithAggregates } from "./mappers";

/**
 * environmentsCount/lastAuditAt/lastReportAt/totalFindings/criticalFindings are aggregates,
 * not columns — computed here via a few batched group-bys rather than one query per project
 * (avoids N+1 on the list view).
 */
export async function withAggregates(
  projects: Awaited<ReturnType<typeof prisma.project.findMany>>
): Promise<ProjectWithAggregates[]> {
  const ids = projects.map((p) => p.id);
  if (ids.length === 0) return [];

  const [owners, envCounts, auditMax, reportMax, findingCounts, criticalCounts] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: projects.map((p) => p.ownerId) } } }),
    prisma.environment.groupBy({ by: ["projectId"], where: { projectId: { in: ids } }, _count: true }),
    prisma.audit.groupBy({ by: ["projectId"], where: { projectId: { in: ids } }, _max: { startedAt: true } }),
    prisma.report.groupBy({ by: ["projectId"], where: { projectId: { in: ids } }, _max: { generatedAt: true } }),
    prisma.finding.groupBy({ by: ["projectId"], where: { projectId: { in: ids } }, _count: true }),
    prisma.finding.groupBy({
      by: ["projectId"],
      where: { projectId: { in: ids }, severity: "CRITICAL" },
      _count: true,
    }),
  ]);

  const ownerById = new Map(owners.map((o) => [o.id, o]));
  const envCountByProject = new Map(envCounts.map((e) => [e.projectId, e._count]));
  const auditMaxByProject = new Map(auditMax.map((a) => [a.projectId, a._max.startedAt]));
  const reportMaxByProject = new Map(reportMax.map((r) => [r.projectId, r._max.generatedAt]));
  const findingCountByProject = new Map(findingCounts.map((f) => [f.projectId, f._count]));
  const criticalCountByProject = new Map(criticalCounts.map((f) => [f.projectId, f._count]));

  return projects.map((p) => ({
    ...p,
    owner: ownerById.get(p.ownerId)!,
    environmentsCount: envCountByProject.get(p.id) ?? 0,
    lastAuditAt: auditMaxByProject.get(p.id) ?? null,
    lastReportAt: reportMaxByProject.get(p.id) ?? null,
    totalFindings: findingCountByProject.get(p.id) ?? 0,
    criticalFindings: criticalCountByProject.get(p.id) ?? 0,
  }));
}

export async function fetchProjects(): Promise<ApiResponse<Project[]>> {
  return guarded(async () => {
    await requireUser();
    const projects = await prisma.project.findMany({
      where: { archivedAt: null },
      orderBy: { createdAt: "desc" },
    });
    const withAgg = await withAggregates(projects);
    return ok(withAgg.map(toProject));
  });
}

export async function fetchProject(projectId: string): Promise<ApiResponse<Project>> {
  return guarded(async () => {
    await requireUser();
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return fail("PROJECT_NOT_FOUND", "Project does not exist.");
    const [withAgg] = await withAggregates([project]);
    return ok(toProject(withAgg));
  });
}

export async function fetchProjectByName(name: string): Promise<ApiResponse<Project>> {
  return guarded(async () => {
    await requireUser();
    const project = await prisma.project.findFirst({ where: { name } });
    if (!project) return fail("PROJECT_NOT_FOUND", "Project does not exist.");
    const [withAgg] = await withAggregates([project]);
    return ok(toProject(withAgg));
  });
}

export async function createProject(input: {
  name: string;
  description: string;
  clientName: string;
}): Promise<ApiResponse<Project>> {
  return guarded(async () => {
    const user = await requireNotViewer();
    if (!input.name.trim()) return fail("VALIDATION_ERROR", "Project name is required.");

    const project = await prisma.project.create({
      data: {
        name: input.name,
        description: input.description,
        clientName: input.clientName,
        ownerId: user.id,
      },
    });
    const [withAgg] = await withAggregates([project]);
    return ok(toProject(withAgg), "Project created successfully.");
  });
}

export async function archiveProject(projectId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.project.update({ where: { id: projectId }, data: { archivedAt: new Date() } });
    return ok(null, "Project archived successfully.");
  });
}

export async function deleteProject(projectId: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.project.delete({ where: { id: projectId } });
    return ok(null, "Project deleted successfully.");
  });
}
