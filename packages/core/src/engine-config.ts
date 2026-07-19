/**
 * Resolves docs/03's "Configuration Hierarchy: Global -> Project -> Environment. Environment
 * config overrides Project config; Project config overrides Global config." The Global level
 * (PlatformSettings) is the only one with defaults for every field — Project/Environment rows
 * carry the same fields as nullable overrides, so "not set" falls through to the next level out.
 */

export type EngineConfig = {
  screenshotQuality: string;
  defaultTimeoutSeconds: number;
  retryCount: number;
  defaultViewport: string;
};

export type EngineConfigOverride = {
  screenshotQuality?: string | null;
  defaultTimeoutSeconds?: number | null;
  retryCount?: number | null;
  defaultViewport?: string | null;
};

export function resolveEngineConfig(
  platform: EngineConfig,
  project: EngineConfigOverride | null | undefined,
  environment: EngineConfigOverride | null | undefined
): EngineConfig {
  return {
    screenshotQuality: environment?.screenshotQuality ?? project?.screenshotQuality ?? platform.screenshotQuality,
    defaultTimeoutSeconds:
      environment?.defaultTimeoutSeconds ?? project?.defaultTimeoutSeconds ?? platform.defaultTimeoutSeconds,
    retryCount: environment?.retryCount ?? project?.retryCount ?? platform.retryCount,
    defaultViewport: environment?.defaultViewport ?? project?.defaultViewport ?? platform.defaultViewport,
  };
}

const VIEWPORT_PATTERN = /(\d+)\s*x\s*(\d+)/i;
const FALLBACK_VIEWPORT = { width: 1440, height: 900 };

/** Parses display strings like "Desktop (1440x900)" into a Playwright viewport size. Falls back
 * to the platform default's own dimensions if the string doesn't contain a WxH pair. */
export function parseViewport(value: string): { width: number; height: number } {
  const match = value.match(VIEWPORT_PATTERN);
  if (!match) return FALLBACK_VIEWPORT;
  return { width: Number(match[1]), height: Number(match[2]) };
}
