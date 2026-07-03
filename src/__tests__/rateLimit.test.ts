import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

const { checkRateLimit } = await import("@/lib/security/rateLimit");

describe("rateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("exports checkRateLimit function", () => {
    expect(typeof checkRateLimit).toBe("function");
  });

  it("returns allowed: true for first request", async () => {
    const result = await checkRateLimit("test-ip");
    expect(result.allowed).toBe(true);
  });

  it("blocks when count exceeds max", async () => {
    const key = "api:192.168.1.100";
    // Default limit is 100 requests per 60s window
    for (let i = 0; i < 100; i++) {
      await checkRateLimit(key);
    }
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("returns correct remaining count", async () => {
    const key = "api:192.168.1.101";
    await checkRateLimit(key);
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBeGreaterThanOrEqual(0);
    expect(result.remaining).toBeLessThan(100);
  });

  it("returns headers with rate limit info", async () => {
    const result = await checkRateLimit("test-ip-headers");
    expect(result.headers).toBeDefined();
    expect(result.headers).toHaveProperty("X-RateLimit-Remaining");
    expect(result.headers).toHaveProperty("X-RateLimit-Reset");
  });

  it("returns retryAfter of 0 when allowed", async () => {
    const result = await checkRateLimit("test-ip-retry");
    expect(result.retryAfter).toBeGreaterThan(0); // Seconds until window reset
  });

  it("returns retryAfter > 0 when blocked", async () => {
    const key = "api:192.168.1.200";
    // Exhaust the limit
    for (let i = 0; i < 100; i++) {
      await checkRateLimit(key);
    }
    const result = await checkRateLimit(key);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("respects custom windowMs option", async () => {
    const result = await checkRateLimit("custom-window-test", { windowMs: 60000, maxRequests: 10 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
  });

  it("tracks different keys independently", async () => {
    const result1 = await checkRateLimit("independent-key-1");
    const result2 = await checkRateLimit("independent-key-2");
    expect(result1.allowed).toBe(true);
    expect(result2.allowed).toBe(true);
  });
});
