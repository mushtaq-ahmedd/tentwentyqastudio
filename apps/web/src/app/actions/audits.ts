"use server";

import { revalidatePath } from "next/cache";
import { auditsApi } from "@/lib/api";
import type { ApiResponse, Audit, ValidationType } from "@/lib/types";

export async function startAuditAction(input: {
  projectId: string;
  environmentId: string;
  validationTypes: ValidationType[];
}): Promise<ApiResponse<Audit>> {
  const result = await auditsApi.startAudit(input);
  revalidatePath("/audit-center");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return result;
}

export async function cancelAuditAction(auditId: string): Promise<ApiResponse<null>> {
  const result = await auditsApi.cancelAudit(auditId);
  revalidatePath("/audit-center");
  revalidatePath("/dashboard");
  revalidatePath("/history");
  return result;
}
