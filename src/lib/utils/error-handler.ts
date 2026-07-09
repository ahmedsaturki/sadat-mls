import { logger } from "@/lib/logger";

export interface AppError {
  code: string;
  message: string;
  i18nKey?: string;
  details?: unknown;
  isRetryable: boolean;
}

export function createAppError(
  code: string,
  message: string,
  details?: unknown,
  isRetryable = false,
  i18nKey?: string
): AppError {
  return { code, message, details, isRetryable, i18nKey };
}

export function handleSupabaseError(error: unknown): AppError {
  if (!error) {
    return createAppError("UNKNOWN", "An unknown error occurred", undefined, false, "errors.unknown");
  }

  const supabaseError = error as { code?: string; message?: string; details?: string };

  switch (supabaseError.code) {
    case "23505":
      return createAppError(
        "DUPLICATE_ENTRY",
        "This record already exists",
        supabaseError.details,
        false,
        "errors.duplicateEntry"
      );
    case "23503":
      return createAppError(
        "FOREIGN_KEY_VIOLATION",
        "Referenced record not found",
        supabaseError.details,
        false,
        "errors.foreignKeyViolation"
      );
    case "23502":
      return createAppError(
        "NOT_NULL_VIOLATION",
        "Required field is missing",
        supabaseError.details,
        false,
        "errors.requiredField"
      );
    case "42501":
      return createAppError(
        "INSUFFICIENT_PRIVILEGE",
        "You don't have permission to perform this action",
        supabaseError.details,
        false,
        "errors.insufficientPrivilege"
      );
    case "PGRST116":
      return createAppError(
        "NOT_FOUND",
        "Record not found",
        supabaseError.details,
        false,
        "errors.notFound"
      );
    case "PGRST301":
      return createAppError(
        "RATE_LIMITED",
        "Too many requests. Please try again later.",
        supabaseError.details,
        true,
        "errors.rateLimited"
      );
    default:
      if (supabaseError.message?.includes("rate limit")) {
        return createAppError(
          "RATE_LIMITED",
          "Too many requests. Please try again later.",
          supabaseError.details,
          true,
          "errors.rateLimited"
        );
      }
      if (supabaseError.message?.includes("JWT")) {
        return createAppError(
          "AUTH_EXPIRED",
          "Your session has expired. Please log in again.",
          supabaseError.details,
          false,
          "errors.sessionExpired"
        );
      }
      return createAppError(
        "DATABASE_ERROR",
        supabaseError.message || "Database error occurred",
        supabaseError.details,
        true,
        "errors.databaseError"
      );
  }
}

export function handleNetworkError(error: unknown): AppError {
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (message.includes("fetch")) {
      return createAppError(
        "NETWORK_ERROR",
        "Network connection failed. Please check your internet connection.",
        error,
        true,
        "errors.networkFailed"
      );
    }
  }
  return createAppError(
    "NETWORK_ERROR",
    "Network error occurred. Please try again.",
    error,
    true,
    "errors.networkError"
  );
}

export function handleError(error: unknown): AppError {
  logger.error("Application error", {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  if (error && typeof error === "object" && "code" in error) {
    return handleSupabaseError(error);
  }

  if (error instanceof TypeError && error.message.includes("fetch")) {
    return handleNetworkError(error);
  }

  return createAppError(
    "UNKNOWN",
    error instanceof Error ? error.message : "An unexpected error occurred",
    error,
    false,
    "errors.unexpected"
  );
}
