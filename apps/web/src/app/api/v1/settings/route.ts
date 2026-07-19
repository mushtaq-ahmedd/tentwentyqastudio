import { type NextRequest } from "next/server";
import { settingsApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET() {
  return respond(await settingsApi.fetchSettings());
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  return respond(await settingsApi.updateSettings(body));
}
