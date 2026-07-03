/**
 * Centralized error handling for Sadat MLS Cloud.
 */
import { logger } from "@/lib/logger";

export interface AppErrorOptions {
  message: string;
  status?: number;
  code?: string;
  isOperational?: boolean;
  context?: Record<string, unknown>;
  cause?: Error;
}

export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly status: number = 500,
    public readonly code: string = "INTERNAL_ERROR",
    public readonly isOperational: boolean = true,
    public readonly context?: Record<string, unknown>,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      status: this.status,
      code: this.code,
      ...(this.context && { context: this.context }),
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors?: Record<string, string[]>) {
    super(message, 400, "VALIDATION_ERROR", true, { fieldErrors });
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      `${resource}${id ? ` with id "${id}"` : "not found"}`, 404, "NOT_FOUND"
    );
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401, "UNAUTHORIZED", true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Forbidden access") {
    super(message, 403, "FORBIDDEN", true);
  }
}

export class RateLimitError extends AppError {
  constructor(
    message: string = "Too many requests",
    public retryAfter: number = 60
  ) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, { retryAfter });
  }
}

export function serializeError(error: unknown): {
  message: string;
  status: number;
  code: string;
  isOperational: boolean;
  stack?: string;
  context?: Record<string, unknown>;
} {
  if (error instanceof AppError) {
    return {
      message: error.message,
      status: error.status,
      code: error.code,
      isOperational: error.isOperational,
      context: error.context,
      stack: error.isOperational ? undefined : error.stack,
    };
  }

  const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
  
  logger.error("Unexpected error:", {
    error,
    stack: error instanceof Error ? error.stack : undefined,
  });

  return {
    message: errorMessage,
    status: 500,
    code: "INTERNAL_ERROR",
    isOperational: false,
    stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
  };
}

export function withErrorHandling<T, Args extends unknown[]>(
  fn: (...args: Args) => Promise<T>,
  options?: {
    context?: Record<string, unknown>;
    onError?: (error: AppError) => AppError | void;
    logger?: typeof logger;
  }
) {
  return async (...args: Args): Promise<T> => {
    try {
      return await fn(...args);
    } catch (error) {
      const loggerToUse = options?.logger || logger;
      
      if (error instanceof AppError) {
        loggerToUse.warn("Operational error occurred:", {
          message: error.message,
          code: error.code,
          status: error.status,
          context: error.context,
          ...options?.context,
        });

        const handledError = options?.onError?.(error) || error;
        throw handledError instanceof AppError ? handledError : error;
      }

      const operationalError = new AppError(
        error instanceof Error ? error.message : "An unexpected error occurred",
        500,
        "INTERNAL_ERROR",
        false,
        { ...options?.context, originalError: error instanceof Error ? error.message : String(error) },
        error as Error
      );

      loggerToUse.error("Unexpected error:", {
        error: operationalError,
        stack: operationalError.stack,
        context: error,
      });

      throw operationalError;
    }
  };
}

export const errorHandler = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  serializeError,
  withErrorHandling,
};
