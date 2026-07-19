import { adminApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

/** Toggles Active/Disabled — see admin.ts for why this is a toggle, not an arbitrary status set. */
export async function PATCH(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return respond(await adminApi.toggleUserStatus(userId));
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return respond(await adminApi.removeUser(userId));
}
