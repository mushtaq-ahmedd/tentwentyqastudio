"use server";

import { revalidatePath } from "next/cache";
import { testFlowsApi } from "@/lib/api";
import type { ApiResponse, FlowStepAction, TestFlow } from "@/lib/types";

export async function createTestFlowAction(input: {
  projectId: string;
  name: string;
  description?: string;
  startUrl: string;
  steps: { action: FlowStepAction; selector: string | null; value: string | null }[];
}): Promise<ApiResponse<TestFlow>> {
  const result = await testFlowsApi.createTestFlow(input);
  revalidatePath(`/projects/${input.projectId}/testing`);
  return result;
}

export async function setTestFlowEnabledAction(
  projectId: string,
  flowId: string,
  enabled: boolean
): Promise<ApiResponse<null>> {
  const result = await testFlowsApi.setTestFlowEnabled(flowId, enabled);
  revalidatePath(`/projects/${projectId}/testing`);
  return result;
}

export async function deleteTestFlowAction(projectId: string, flowId: string): Promise<ApiResponse<null>> {
  const result = await testFlowsApi.deleteTestFlow(flowId);
  revalidatePath(`/projects/${projectId}/testing`);
  return result;
}
