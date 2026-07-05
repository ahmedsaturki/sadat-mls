import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry, isNetworkError, isRateLimitError, isAuthError } from "@/lib/utils/retry";

describe("withRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withRetry(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and eventually succeeds", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockResolvedValue("success");
    const result = await withRetry(fn, { maxRetries: 2, baseDelay: 10 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws after max retries exceeded", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("persistent failure"));
    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 10 })
    ).rejects.toThrow("persistent failure");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("respects retryOn predicate", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("no retry"));
    await expect(
      withRetry(fn, {
        maxRetries: 3,
        baseDelay: 10,
        retryOn: () => false,
      })
    ).rejects.toThrow("no retry");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries only when retryOn returns true", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("retryable"))
      .mockResolvedValue("success");
    const result = await withRetry(fn, {
      maxRetries: 3,
      baseDelay: 10,
      retryOn: (err) => err instanceof Error && err.message.includes("retryable"),
    });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("uses exponential backoff", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    await withRetry(fn, {
      maxRetries: 3,
      baseDelay: 50,
      backoffMultiplier: 2,
    });

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("caps delay at maxDelay", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("success");

    await withRetry(fn, {
      maxRetries: 1,
      baseDelay: 1000,
      maxDelay: 100,
    });

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("handles non-Error throws", async () => {
    const fn = vi.fn().mockRejectedValue("string error");
    await expect(
      withRetry(fn, { maxRetries: 1, baseDelay: 10 })
    ).rejects.toBe("string error");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("handles maxRetries=0 (single attempt)", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));
    await expect(
      withRetry(fn, { maxRetries: 0, baseDelay: 10 })
    ).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("uses default options when none provided", async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error("fail"))
      .mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("isNetworkError", () => {
  it("detects 'network' in message", () => {
    expect(isNetworkError(new Error("Network error"))).toBe(true);
  });

  it("detects 'fetch' in message", () => {
    expect(isNetworkError(new Error("fetch failed"))).toBe(true);
  });

  it("detects 'timeout' in message", () => {
    expect(isNetworkError(new Error("Request timeout"))).toBe(true);
  });

  it("detects 'econnrefused' in message", () => {
    expect(isNetworkError(new Error("ECONNREFUSED"))).toBe(true);
  });

  it("detects 'econnreset' in message", () => {
    expect(isNetworkError(new Error("ECONNRESET"))).toBe(true);
  });

  it("returns false for non-network errors", () => {
    expect(isNetworkError(new Error("Validation failed"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isNetworkError("string")).toBe(false);
    expect(isNetworkError(null)).toBe(false);
    expect(isNetworkError(undefined)).toBe(false);
    expect(isNetworkError(42)).toBe(false);
  });
});

describe("isRateLimitError", () => {
  it("detects 'rate limit' in message", () => {
    expect(isRateLimitError(new Error("Rate limit exceeded"))).toBe(true);
  });

  it("detects '429' in message", () => {
    expect(isRateLimitError(new Error("HTTP 429"))).toBe(true);
  });

  it("returns false for non-rate-limit errors", () => {
    expect(isRateLimitError(new Error("Not found"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isRateLimitError(null)).toBe(false);
    expect(isRateLimitError(undefined)).toBe(false);
  });
});

describe("isAuthError", () => {
  it("detects 'unauthorized' in message", () => {
    expect(isAuthError(new Error("Unauthorized access"))).toBe(true);
  });

  it("detects '401' in message", () => {
    expect(isAuthError(new Error("HTTP 401"))).toBe(true);
  });

  it("detects 'jwt' in message", () => {
    expect(isAuthError(new Error("JWT expired"))).toBe(true);
  });

  it("returns false for non-auth errors", () => {
    expect(isAuthError(new Error("Server error"))).toBe(false);
  });

  it("returns false for non-Error values", () => {
    expect(isAuthError(null)).toBe(false);
    expect(isAuthError(undefined)).toBe(false);
    expect(isAuthError(42)).toBe(false);
  });
});
