import type { PlatformSettings } from "@/lib/types";
import { PROJECT_ACME } from "./projects";

export let SETTINGS: PlatformSettings = {
  displayName: "Mushtaq Ahmed",
  defaultProjectId: PROJECT_ACME,
  defaultEnvironmentName: "QA",
  theme: "Light",
  aiProvider: "Anthropic",
  aiConnectionStatus: "Connected",
  aiApiKeyStatus: "Valid",
  aiDefaultModel: "claude-sonnet-5",
  screenshotQuality: "High",
  defaultTimeoutSeconds: 30,
  retryCount: 2,
  defaultViewport: "Desktop (1440x900)",
};

export function updateSettings(patch: Partial<PlatformSettings>) {
  SETTINGS = { ...SETTINGS, ...patch };
  return SETTINGS;
}
