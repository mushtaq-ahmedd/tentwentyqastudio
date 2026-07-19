/**
 * Standard response envelope — docs/05-database-and-api.md "Standard Response Envelope".
 * No endpoint may deviate from this shape.
 */
export type ApiSuccess<T> = {
  success: true;
  data: T;
  message: string;
};

export type ApiErrorCode =
  | "PROJECT_NOT_FOUND"
  | "ENVIRONMENT_NOT_FOUND"
  | "KNOWLEDGE_SOURCE_NOT_FOUND"
  | "AUDIT_NOT_FOUND"
  | "FINDING_NOT_FOUND"
  | "REPORT_NOT_FOUND"
  | "USER_NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "UNKNOWN_ERROR";

export type ApiError = {
  success: false;
  error: {
    code: ApiErrorCode;
    message: string;
  };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
