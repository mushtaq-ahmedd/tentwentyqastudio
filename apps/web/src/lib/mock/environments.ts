import type { Environment } from "@/lib/types";
import { PROJECT_ACME, PROJECT_FENWICK, PROJECT_NORTHWIND } from "./projects";

export let ENVIRONMENTS: Environment[] = [
  { id: "env-acme-dev", projectId: PROJECT_ACME, name: "Development", url: "dev.acmecorp.com", loginUrl: "dev.acmecorp.com/login", status: "online", authStatus: "verified", notes: "" },
  { id: "env-acme-qa", projectId: PROJECT_ACME, name: "QA", url: "qa.acmecorp.com", loginUrl: "qa.acmecorp.com/login", status: "online", authStatus: "verified", notes: "" },
  { id: "env-acme-staging", projectId: PROJECT_ACME, name: "Staging", url: "staging.acmecorp.com", loginUrl: "staging.acmecorp.com/login", status: "online", authStatus: "verified", notes: "" },
  { id: "env-acme-prod", projectId: PROJECT_ACME, name: "Production", url: "acmecorp.com", loginUrl: "acmecorp.com/login", status: "online", authStatus: "verified", notes: "" },

  { id: "env-northwind-qa", projectId: PROJECT_NORTHWIND, name: "QA", url: "qa.portal.northwind.com", loginUrl: null, status: "online", authStatus: "verified", notes: "" },
  { id: "env-northwind-staging", projectId: PROJECT_NORTHWIND, name: "Staging", url: "staging.portal.northwind.com", loginUrl: null, status: "online", authStatus: "verified", notes: "" },
  { id: "env-northwind-prod", projectId: PROJECT_NORTHWIND, name: "Production", url: "portal.northwind.com", loginUrl: null, status: "online", authStatus: "not-configured", notes: "" },

  { id: "env-fenwick-staging", projectId: PROJECT_FENWICK, name: "Staging", url: "staging.docs.fenwick.dev", loginUrl: null, status: "online", authStatus: "verified", notes: "" },
  { id: "env-fenwick-prod", projectId: PROJECT_FENWICK, name: "Production", url: "docs.fenwick.dev", loginUrl: null, status: "online", authStatus: "verified", notes: "" },
];

export function addEnvironment(input: {
  projectId: string;
  name: string;
  url: string;
  loginUrl?: string;
  notes?: string;
}): Environment {
  const env: Environment = {
    id: `env-${crypto.randomUUID().slice(0, 8)}`,
    projectId: input.projectId,
    name: input.name || "New Environment",
    url: input.url || "example.com",
    loginUrl: input.loginUrl ?? null,
    status: "online",
    authStatus: "not-configured",
    notes: input.notes ?? "",
  };
  ENVIRONMENTS = [...ENVIRONMENTS, env];
  return env;
}

export function deleteEnvironment(environmentId: string) {
  ENVIRONMENTS = ENVIRONMENTS.filter((e) => e.id !== environmentId);
}
