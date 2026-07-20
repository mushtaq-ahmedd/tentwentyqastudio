"use server";

import { revalidatePath } from "next/cache";
import { findingsApi } from "@/lib/api";
import type { ApiResponse, FindingStatus } from "@/lib/types";

export async function setFindingStatusAction(
  findingId: string,
  status: FindingStatus
): Promise<ApiResponse<null>> {
  const result = await findingsApi.setFindingStatus(findingId, status);
  revalidatePath("/findings");
  revalidatePath("/dashboard");
  return result;
}

export async function bulkSetFindingStatusAction(
  findingIds: string[],
  status: FindingStatus
): Promise<ApiResponse<null>> {
  const result = await findingsApi.bulkSetFindingStatus(findingIds, status);
  revalidatePath("/findings");
  revalidatePath("/dashboard");
  return result;
}

export async function deleteFindingsAction(findingIds: string[]): Promise<ApiResponse<null>> {
  const result = await findingsApi.deleteFindings(findingIds);
  revalidatePath("/findings");
  revalidatePath("/dashboard");
  return result;
}

export async function clearAllFindingsAction(projectId?: string): Promise<ApiResponse<{ count: number }>> {
  const result = await findingsApi.deleteAllFindings({ projectId });
  revalidatePath("/findings");
  revalidatePath("/dashboard");
  return result;
}
