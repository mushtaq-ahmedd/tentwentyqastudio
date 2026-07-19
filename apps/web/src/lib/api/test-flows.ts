import { prisma } from "@tentwenty/db";
import type { ApiResponse, FlowStepAction, TestFlow } from "@/lib/types";
import { requireNotViewer, requireUser } from "@/lib/auth/session";
import { fail, guarded, ok } from "./client";
import { toTestFlow } from "./mappers";

const FLOW_STEP_ACTION_TO_DB: Record<FlowStepAction, string> = {
  Navigate: "NAVIGATE",
  Click: "CLICK",
  Fill: "FILL",
  "Press Key": "PRESS_KEY",
  "Assert Visible": "ASSERT_VISIBLE",
  "Assert Text": "ASSERT_TEXT",
  "Assert URL": "ASSERT_URL",
};

const TEST_FLOW_INCLUDE = { steps: { orderBy: { order: "asc" as const } } };

export async function fetchTestFlows(projectId: string): Promise<ApiResponse<TestFlow[]>> {
  return guarded(async () => {
    await requireUser();
    const flows = await prisma.testFlow.findMany({
      where: { projectId },
      include: TEST_FLOW_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return ok(flows.map(toTestFlow));
  });
}

export async function createTestFlow(input: {
  projectId: string;
  name: string;
  description?: string;
  startUrl: string;
  steps: { action: FlowStepAction; selector: string | null; value: string | null }[];
}): Promise<ApiResponse<TestFlow>> {
  return guarded(async () => {
    const user = await requireNotViewer();
    if (!input.name.trim()) return fail("VALIDATION_ERROR", "Give this flow a name.");
    if (!input.startUrl.trim()) return fail("VALIDATION_ERROR", "A start URL (or path) is required.");
    if (input.steps.length === 0) return fail("VALIDATION_ERROR", "Add at least one step.");

    for (const step of input.steps) {
      const needsSelector = step.action === "Click" || step.action === "Fill" || step.action === "Assert Visible";
      if (needsSelector && !step.selector?.trim()) {
        return fail("VALIDATION_ERROR", `"${step.action}" steps require a selector.`);
      }
    }

    const flow = await prisma.testFlow.create({
      data: {
        projectId: input.projectId,
        name: input.name,
        description: input.description ?? "",
        startUrl: input.startUrl,
        createdById: user.id,
        steps: {
          create: input.steps.map((s, i) => ({
            order: i + 1,
            action: FLOW_STEP_ACTION_TO_DB[s.action] as never,
            selector: s.selector,
            value: s.value,
          })),
        },
      },
      include: TEST_FLOW_INCLUDE,
    });

    return ok(toTestFlow(flow), "Test flow created — it will replay on every audit that includes Functional Validation.");
  });
}

export async function setTestFlowEnabled(id: string, enabled: boolean): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.testFlow.update({ where: { id }, data: { enabled } });
    return ok(null, enabled ? "Test flow enabled." : "Test flow disabled.");
  });
}

export async function deleteTestFlow(id: string): Promise<ApiResponse<null>> {
  return guarded(async () => {
    await requireNotViewer();
    await prisma.testFlow.delete({ where: { id } });
    return ok(null, "Test flow deleted.");
  });
}
