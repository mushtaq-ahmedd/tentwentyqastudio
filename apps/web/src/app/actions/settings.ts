"use server";

import { revalidatePath } from "next/cache";
import { settingsApi } from "@/lib/api";
import type { ApiResponse, PlatformSettings } from "@/lib/types";

export async function updateSettingsAction(
  patch: Partial<PlatformSettings>
): Promise<ApiResponse<PlatformSettings>> {
  const result = await settingsApi.updateSettings(patch);
  revalidatePath("/settings");
  return result;
}
