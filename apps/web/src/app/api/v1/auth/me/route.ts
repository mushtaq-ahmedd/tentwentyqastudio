import { adminApi } from "@/lib/api";
import { respond } from "@/lib/api/http";

export async function GET() {
  return respond(await adminApi.fetchCurrentUser());
}
