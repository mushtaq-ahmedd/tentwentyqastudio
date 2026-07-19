import { unstable_rethrow } from "next/navigation";
import type { ApiError, ApiErrorCode, ApiResponse, ApiSuccess } from "@/lib/types";
import { AuthError } from "@/lib/auth/session";

/**
 * Every function in lib/api/ returns one of these, matching docs/05's standard envelope
 * exactly.
 */
export function ok<T>(data: T, message = "Request completed successfully."): ApiSuccess<T> {
  return { success: true, data, message };
}

export function fail(code: ApiErrorCode, message: string): ApiError {
  return { success: false, error: { code, message } };
}

/**
 * Wraps a lib/api function body so thrown AuthError (unauthenticated/forbidden) and unexpected
 * errors both come back as a normal ApiResponse instead of an uncaught rejection — Server
 * Actions and Route Handlers can both just check `result.success` uniformly.
 */
export async function guarded<T>(fn: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message);
    // Next.js's own control-flow errors (redirect/notFound/dynamic-render bailout from
    // cookies()) must propagate untouched — swallowing them breaks Next's rendering pipeline.
    unstable_rethrow(e);
    console.error(e);
    return fail("UNKNOWN_ERROR", "Something went wrong. Please try again.");
  }
}
