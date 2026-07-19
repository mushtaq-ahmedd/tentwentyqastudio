import { type NextRequest } from "next/server";
import { testFlowsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  const body = await request.json();
  return respond(await testFlowsApi.setTestFlowEnabled(flowId, Boolean(body.enabled)));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ flowId: string }> }) {
  const { flowId } = await params;
  return respond(await testFlowsApi.deleteTestFlow(flowId));
}
