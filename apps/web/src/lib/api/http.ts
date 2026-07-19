import { NextResponse } from "next/server";
import type { ApiErrorCode, ApiResponse } from "@/lib/types";

const STATUS_BY_ERROR_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 400,
  FIGMA_VERIFICATION_FAILED: 422,
  INVITE_FAILED: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  PROJECT_NOT_FOUND: 404,
  ENVIRONMENT_NOT_FOUND: 404,
  KNOWLEDGE_SOURCE_NOT_FOUND: 404,
  AUDIT_NOT_FOUND: 404,
  FINDING_NOT_FOUND: 404,
  REPORT_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,
  UNKNOWN_ERROR: 500,
};

/** Translates our ApiResponse envelope into a NextResponse with the right HTTP status —
 * docs/05 "HTTP Status Codes". */
export function respond<T>(result: ApiResponse<T>, successStatus = 200): NextResponse {
  if (result.success) return NextResponse.json(result, { status: successStatus });
  return NextResponse.json(result, { status: STATUS_BY_ERROR_CODE[result.error.code] });
}
