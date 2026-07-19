import type { Project } from "@/lib/types";

export const PROJECT_ACME = "proj-acme";
export const PROJECT_NORTHWIND = "proj-northwind";
export const PROJECT_FENWICK = "proj-fenwick";

export let PROJECTS: Project[] = [
  {
    id: PROJECT_ACME,
    name: "Acme Corp Website",
    description: "Marketing + e-commerce site for Acme Corp, covering homepage, pricing, and checkout.",
    clientName: "Acme Corp",
    baseUrl: "acmecorp.com",
    figmaFileUrl: "https://figma.com/design/acme-homepage",
    status: "ready-with-warnings",
    owner: "J. Reyes",
    createdAt: "2026-05-02T09:00:00Z",
    environmentsCount: 4,
    lastAuditAt: "2026-07-16T09:44:32Z",
    lastReportAt: "2026-07-16T10:00:00Z",
    totalFindings: 31,
    criticalFindings: 3,
  },
  {
    id: PROJECT_NORTHWIND,
    name: "Northwind Portal",
    description: "Customer self-service portal for Northwind.",
    clientName: "Northwind Traders",
    baseUrl: "portal.northwind.com",
    figmaFileUrl: null,
    status: "not-ready",
    owner: "J. Reyes",
    createdAt: "2026-04-11T09:00:00Z",
    environmentsCount: 3,
    lastAuditAt: "2026-07-15T10:02:10Z",
    lastReportAt: null,
    totalFindings: 8,
    criticalFindings: 1,
  },
  {
    id: PROJECT_FENWICK,
    name: "Fenwick Docs",
    description: "Public documentation site for Fenwick.",
    clientName: "Fenwick",
    baseUrl: "docs.fenwick.dev",
    figmaFileUrl: null,
    status: "ready",
    owner: "A. Suri",
    createdAt: "2026-03-20T09:00:00Z",
    environmentsCount: 2,
    lastAuditAt: "2026-07-12T08:09:44Z",
    lastReportAt: "2026-07-12T08:30:00Z",
    totalFindings: 6,
    criticalFindings: 0,
  },
];

export function createProject(input: {
  name: string;
  description: string;
  clientName: string;
}): Project {
  const project: Project = {
    id: `proj-${crypto.randomUUID().slice(0, 8)}`,
    name: input.name || "New Project",
    description: input.description,
    clientName: input.clientName,
    baseUrl: "",
    figmaFileUrl: null,
    status: "not-ready",
    owner: "You",
    createdAt: new Date().toISOString(),
    environmentsCount: 0,
    lastAuditAt: null,
    lastReportAt: null,
    totalFindings: 0,
    criticalFindings: 0,
  };
  PROJECTS = [...PROJECTS, project];
  return project;
}

export function archiveOrDeleteProject(projectId: string) {
  PROJECTS = PROJECTS.filter((p) => p.id !== projectId);
}
