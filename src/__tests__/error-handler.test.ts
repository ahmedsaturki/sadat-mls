import { describe, it, expect } from "vitest";
import {
  handleError,
  handleSupabaseError,
  handleNetworkError,
  createAppError,
} from "@/lib/utils/error-handler";
import { isNetworkError, isRateLimitError, isAuthError } from "@/lib/utils/retry";

describe("error-handler", () => {
  describe("createAppError", () => {
    it("creates error with all properties", () => {
      const error = createAppError("TEST", "Test message", { detail: 1 }, true);
      expect(error.code).toBe("TEST");
      expect(error.message).toBe("Test message");
      expect(error.details).toEqual({ detail: 1 });
      expect(error.isRetryable).toBe(true);
    });

    it("creates error with defaults", () => {
      const error = createAppError("TEST", "Test message");
      expect(error.isRetryable).toBe(false);
      expect(error.details).toBeUndefined();
    });
  });

  describe("handleSupabaseError", () => {
    it("handles duplicate entry error (23505)", () => {
      const error = handleSupabaseError({ code: "23505", message: "duplicate", details: "test" });
      expect(error.code).toBe("DUPLICATE_ENTRY");
      expect(error.isRetryable).toBe(false);
    });

    it("handles foreign key violation (23503)", () => {
      const error = handleSupabaseError({ code: "23503" });
      expect(error.code).toBe("FOREIGN_KEY_VIOLATION");
    });

    it("handles not null violation (23502)", () => {
      const error = handleSupabaseError({ code: "23502" });
      expect(error.code).toBe("NOT_NULL_VIOLATION");
    });

    it("handles insufficient privilege (42501)", () => {
      const error = handleSupabaseError({ code: "42501" });
      expect(error.code).toBe("INSUFFICIENT_PRIVILEGE");
    });

    it("handles not found (PGRST116)", () => {
      const error = handleSupabaseError({ code: "PGRST116" });
      expect(error.code).toBe("NOT_FOUND");
    });

    it("handles rate limit (PGRST301)", () => {
      const error = handleSupabaseError({ code: "PGRST301" });
      expect(error.code).toBe("RATE_LIMITED");
      expect(error.isRetryable).toBe(true);
    });

    it("handles rate limit message", () => {
      const error = handleSupabaseError({ message: "rate limit exceeded" });
      expect(error.code).toBe("RATE_LIMITED");
      expect(error.isRetryable).toBe(true);
    });

    it("handles JWT error", () => {
      const error = handleSupabaseError({ message: "JWT expired" });
      expect(error.code).toBe("AUTH_EXPIRED");
    });

    it("handles unknown error code", () => {
      const error = handleSupabaseError({ code: "UNKNOWN", message: "something" });
      expect(error.code).toBe("DATABASE_ERROR");
      expect(error.isRetryable).toBe(true);
    });

    it("handles null error", () => {
      const error = handleSupabaseError(null);
      expect(error.code).toBe("UNKNOWN");
    });
  });

  describe("handleNetworkError", () => {
    it("handles fetch error", () => {
      const error = handleNetworkError(new TypeError("Failed to fetch"));
      expect(error.code).toBe("NETWORK_ERROR");
      expect(error.isRetryable).toBe(true);
    });

    it("handles other TypeError", () => {
      const error = handleNetworkError(new TypeError("other"));
      expect(error.code).toBe("NETWORK_ERROR");
    });
  });

  describe("handleError", () => {
    it("handles Supabase error objects", () => {
      const error = handleError({ code: "23505" });
      expect(error.code).toBe("DUPLICATE_ENTRY");
    });

    it("handles network errors", () => {
      const error = handleError(new TypeError("Failed to fetch"));
      expect(error.code).toBe("NETWORK_ERROR");
    });

    it("handles generic errors", () => {
      const error = handleError(new Error("generic"));
      expect(error.code).toBe("UNKNOWN");
      expect(error.message).toBe("generic");
    });

    it("handles unknown values", () => {
      const error = handleError("string error");
      expect(error.code).toBe("UNKNOWN");
    });
  });

  describe("helper functions", () => {
    it("isNetworkError detects network errors", () => {
      expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
      expect(isNetworkError(new Error("network error"))).toBe(true);
      expect(isNetworkError(new Error("timeout"))).toBe(true);
      expect(isNetworkError(new Error("other"))).toBe(false);
      expect(isNetworkError(null)).toBe(false);
    });

    it("isRateLimitError detects rate limit errors", () => {
      expect(isRateLimitError(new Error("rate limit exceeded"))).toBe(true);
      expect(isRateLimitError(new Error("429 too many"))).toBe(true);
      expect(isRateLimitError(new Error("other"))).toBe(false);
    });

    it("isAuthError detects auth errors", () => {
      expect(isAuthError(new Error("unauthorized"))).toBe(true);
      expect(isAuthError(new Error("401"))).toBe(true);
      expect(isAuthError(new Error("jwt expired"))).toBe(true);
      expect(isAuthError(new Error("other"))).toBe(false);
    });
  });
});
