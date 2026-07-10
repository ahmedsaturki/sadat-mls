import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Supabase service-role client to prevent real DB calls in tests
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    rpc: vi.fn().mockResolvedValue({ data: null, error: { message: "mocked" } }),
    from: vi.fn().mockReturnValue({
      delete: vi.fn().mockReturnValue({
        lt: vi.fn().mockResolvedValue({ error: null }),
      }),
    }),
  }),
}));

const { checkRateLimit, checkApiRateLimit, checkAuthRateLimit, clearRateLimitStore } = await import("@/lib/security/rateLimit");

describe("rateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearRateLimitStore();
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

  it("returns retryAfter > 0 when allowed (seconds until window reset)", async () => {
    const result = await checkRateLimit("test-ip-retry");
    expect(result.retryAfter).toBeGreaterThan(0);
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

  // ── New tests for hybrid flow and helper functions ──────────────────

  describe("key parsing (extractIpFromKey / extractActionFromKey)", () => {
    it("parses action:ip format correctly", async () => {
      const result = await checkApiRateLimit("agents-post:192.168.1.1");
      expect(result.allowed).toBe(true);
      expect(result.headers["X-RateLimit-Limit"]).toBe("100");
    });

    it("handles keys with multiple colons in action", async () => {
      const result = await checkApiRateLimit("api:auth:login:10.0.0.1");
      expect(result.allowed).toBe(true);
    });

    it("handles keys with no colon (ip-only)", async () => {
      const result = await checkApiRateLimit("192.168.1.1");
      expect(result.allowed).toBe(true);
    });
  });

  describe("window calculation (calculateWindowStart)", () => {
    it("returns resetTime aligned to window boundary", async () => {
      const now = Date.now();
      const result = await checkApiRateLimit("window-test-key", undefined, { windowMs: 60000, maxRequests: 100 });
      // resetTime should be in the future, within one window of now
      expect(result.resetTime).toBeGreaterThan(now);
      expect(result.resetTime).toBeLessThanOrEqual(now + 61000);
    });

    it("different window sizes produce different resetTime ranges", async () => {
      const now = Date.now();
      const short = await checkApiRateLimit("short-window", undefined, { windowMs: 10000, maxRequests: 100 });
      const long = await checkApiRateLimit("long-window", undefined, { windowMs: 120000, maxRequests: 100 });
      // Short window should reset sooner than long window (allow 1s tolerance for window alignment)
      expect(short.resetTime).toBeLessThanOrEqual(now + 11000);
      expect(long.resetTime).toBeLessThanOrEqual(now + 121000);
      // Long window should reset significantly later than short window
      expect(long.resetTime).toBeGreaterThan(short.resetTime);
    });
  });

  describe("checkApiRateLimit vs checkAuthRateLimit", () => {
    it("checkApiRateLimit defaults to 100 max requests", async () => {
      const result = await checkApiRateLimit("api-default");
      expect(result.headers["X-RateLimit-Limit"]).toBe("100");
    });

    it("checkAuthRateLimit defaults to 10 max requests", async () => {
      const result = await checkAuthRateLimit("auth-default");
      expect(result.headers["X-RateLimit-Limit"]).toBe("10");
    });

    it("checkAuthRateLimit blocks at 10 requests", async () => {
      const key = "auth-block-test";
      for (let i = 0; i < 10; i++) {
        await checkAuthRateLimit(key);
      }
      const result = await checkAuthRateLimit(key);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });
  });

  describe("hybrid L1/L2 flow", () => {
    it("uses L1 cache for same-window requests (no DB hit)", async () => {
      const key = "l1-cache-test";
      // First request hits L2 (DB), subsequent hit L1 (cache)
      await checkApiRateLimit(key);
      const result = await checkApiRateLimit(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(98); // 100 - 2
    });

    it("clearRateLimitStore resets L1 cache", async () => {
      const key = "clear-test";
      await checkApiRateLimit(key);
      clearRateLimitStore();
      // After clear, next request should be treated as first
      const result = await checkApiRateLimit(key);
      expect(result.allowed).toBe(true);
      // remaining should be 99 (fresh start), not 98
      expect(result.remaining).toBe(99);
    });
  });

  describe("edge cases", () => {
    it("handles maxRequests of 1 (single request allowed)", async () => {
      const opts = { maxRequests: 1, windowMs: 60000 };
      const result = await checkApiRateLimit("single-request", undefined, opts);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(0);
      const blocked = await checkApiRateLimit("single-request", undefined, opts);
      expect(blocked.allowed).toBe(false);
    });

    it("handles very large maxRequests", async () => {
      const result = await checkApiRateLimit("large-limit", undefined, { maxRequests: 1000000, windowMs: 60000 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(999999);
    });

    it("X-RateLimit-Remaining never goes negative", async () => {
      const key = "negative-test";
      for (let i = 0; i < 110; i++) {
        await checkApiRateLimit(key, undefined, { maxRequests: 100, windowMs: 60000 });
      }
      const result = await checkApiRateLimit(key, undefined, { maxRequests: 100, windowMs: 60000 });
      expect(parseInt(result.headers["X-RateLimit-Remaining"])).toBeGreaterThanOrEqual(0);
    });
  });
});
