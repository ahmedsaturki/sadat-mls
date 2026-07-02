import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "@/lib/utils/retry";

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
});
