type LogLevel = "debug" | "info" | "warn" | "error";

interface LogContext {
  [key: string]: unknown;
}

function formatTime(): string {
  return new Date().toISOString();
}

function log(level: LogLevel, message: string, context?: LogContext) {
  const prefix = `[${formatTime()}] [${level.toUpperCase()}]`;
  const contextStr = context ? ` ${JSON.stringify(context)}` : "";

  switch (level) {
    case "debug":
      console.debug(`${prefix} ${message}${contextStr}`);
      break;
    case "info":
      console.info(`${prefix} ${message}${contextStr}`);
      break;
    case "warn":
      console.warn(`${prefix} ${message}${contextStr}`);
      break;
    case "error":
      console.error(`${prefix} ${message}${contextStr}`);
      break;
  }
}

export const logger = {
  debug: (message: string, context?: LogContext) => log("debug", message, context),
  info: (message: string, context?: LogContext) => log("info", message, context),
  warn: (message: string, context?: LogContext) => log("warn", message, context),
  error: (message: string, context?: LogContext) => log("error", message, context),

  /** Convenience: log an API request */
  apiRequest: (method: string, path: string, context?: LogContext) => {
    log("info", `${method} ${path}`, context);
  },

  /** Convenience: log an API response */
  apiResponse: (method: string, path: string, status: number, context?: LogContext) => {
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    log(level, `${method} ${path} → ${status}`, context);
  },

  /** Convenience: log Supabase errors */
  supabaseError: (operation: string, error: { message: string; code?: string }) => {
    const level = error.code === "over_request_rate_limit" ? "warn" : "error";
    log(level, `Supabase ${operation} failed`, { code: error.code, message: error.message });
  },

  /** Log rate limit warnings */
  rateLimit: (endpoint: string, retryAfter?: number) => {
    log("warn", `Rate limit hit for ${endpoint}`, { retryAfter });
  },
};
