import { type NextRequest } from "next/server";
import { auditsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function POST(request: NextRequest) {
  const body = await request.json();
  return respond(await auditsApi.startAudit(body), 201);
}
