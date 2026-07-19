import { type NextRequest } from "next/server";
import { adminApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET() {
  return respond(await adminApi.fetchAdminUsers());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return respond(await adminApi.inviteUser(body), 201);
}
