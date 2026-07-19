import { prisma } from "@tentwenty/db";
import type { ApiResponse, PlatformSettings } from "@/lib/types";
import { requireAdministrator, requireUser } from "@/lib/auth/session";
import { guarded, ok } from "./client";
import { toSettings } from "./mappers";

export async function fetchSettings(): Promise<ApiResponse<PlatformSettings>> {
  return guarded(async () => {
    const user = await requireUser();
    const row = await prisma.platformSettings.upsert({ where: { id: 1 }, update: {}, create: { id: 1 } });
    const settings = toSettings(row);
    // displayName/defaultProjectId/defaultEnvironmentName/theme are per-user preferences, not
    // part of the platform-wide settings row — there's no per-user-preferences table yet, so
    // only displayName is filled in for real; the rest stay placeholder defaults.
    return ok({ ...settings, displayName: user.name });
  });
}

export async function updateSettings(
  patch: Partial<PlatformSettings>
): Promise<ApiResponse<PlatformSettings>> {
  return guarded(async () => {
    const user = await requireAdministrator();
    const row = await prisma.platformSettings.upsert({
      where: { id: 1 },
      update: {
        aiProvider: patch.aiProvider,
        aiDefaultModel: patch.aiDefaultModel,
        screenshotQuality: patch.screenshotQuality,
        defaultTimeoutSeconds: patch.defaultTimeoutSeconds,
        retryCount: patch.retryCount,
        defaultViewport: patch.defaultViewport,
      },
      create: { id: 1 },
    });
    return ok({ ...toSettings(row), displayName: user.name }, "Settings updated.");
  });
}
