import type { Environment } from "@/lib/types";
import { PROJECT_ACME, PROJECT_FENWICK, PROJECT_NORTHWIND } from "./projects";

const NO_OVERRIDES = {
  screenshotQuality: null,
  defaultTimeoutSeconds: null,
  retryCount: null,
  defaultViewport: null,
} as const;

export let ENVIRONMENTS: Environment[] = [
  { id: "env-acme-dev", projectId: PROJECT_ACME, name: "Development", url: "dev.acmecorp.com", loginUrl: "dev.acmecorp.com/login", status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
  { id: "env-acme-qa", projectId: PROJECT_ACME, name: "QA", url: "qa.acmecorp.com", loginUrl: "qa.acmecorp.com/login", status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
  { id: "env-acme-staging", projectId: PROJECT_ACME, name: "Staging", url: "staging.acmecorp.com", loginUrl: "staging.acmecorp.com/login", status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
  { id: "env-acme-prod", projectId: PROJECT_ACME, name: "Production", url: "acmecorp.com", loginUrl: "acmecorp.com/login", status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },

  { id: "env-northwind-qa", projectId: PROJECT_NORTHWIND, name: "QA", url: "qa.portal.northwind.com", loginUrl: null, status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
  { id: "env-northwind-staging", projectId: PROJECT_NORTHWIND, name: "Staging", url: "staging.portal.northwind.com", loginUrl: null, status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
  { id: "env-northwind-prod", projectId: PROJECT_NORTHWIND, name: "Production", url: "portal.northwind.com", loginUrl: null, status: "online", authStatus: "not-configured", notes: "", ...NO_OVERRIDES },

  { id: "env-fenwick-staging", projectId: PROJECT_FENWICK, name: "Staging", url: "staging.docs.fenwick.dev", loginUrl: null, status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
  { id: "env-fenwick-prod", projectId: PROJECT_FENWICK, name: "Production", url: "docs.fenwick.dev", loginUrl: null, status: "online", authStatus: "verified", notes: "", ...NO_OVERRIDES },
];

export function addEnvironment(input: {
  projectId: string;
  name: string;
  url: string;
  loginUrl?: string;
  notes?: string;
  screenshotQuality?: "High" | "Medium" | null;
  defaultTimeoutSeconds?: number | null;
  retryCount?: number | null;
  defaultViewport?: string | null;
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
    screenshotQuality: input.screenshotQuality ?? null,
    defaultTimeoutSeconds: input.defaultTimeoutSeconds ?? null,
    retryCount: input.retryCount ?? null,
    defaultViewport: input.defaultViewport ?? null,
  };
  ENVIRONMENTS = [...ENVIRONMENTS, env];
  return env;
}

export function deleteEnvironment(environmentId: string) {
  ENVIRONMENTS = ENVIRONMENTS.filter((e) => e.id !== environmentId);
}
