import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockRpc, mockDelete, counts } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
  mockDelete: vi.fn(),
  counts: new Map<string, number>(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the authoritative database increment function, not an in-memory rate-limit store.
vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    rpc: mockRpc,
    from: vi.fn().mockReturnValue({
      delete: mockDelete,
    }),
  }),
}));

const {
  checkRateLimit,
  checkApiRateLimit,
  checkAuthRateLimit,
  clearRateLimitStore,
} = await import("@/lib/security/rateLimit");

describe("rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    counts.clear();
    clearRateLimitStore();

    mockRpc.mockImplementation(
      async (_functionName: string, params: { p_action: string; p_ip: string; p_window_start: string }) => {
        const key = `${params.p_action}|${params.p_ip}|${params.p_window_start}`;
        const count = (counts.get(key) ?? 0) + 1;
        counts.set(key, count);
        return { data: count, error: null };
      },
    );

    mockDelete.mockReturnValue({
      lt: vi.fn().mockResolvedValue({ error: null }),
    });
  });

  it("exports checkRateLimit function", () => {
    expect(typeof checkRateLimit).toBe("function");
  });

  it("allows the first request", async () => {
    const result = await checkRateLimit("test-ip");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
    expect(result.headers["X-RateLimit-Limit"]).toBe("100");
    expect(mockRpc).toHaveBeenCalledWith(
      "increment_security_rate_limit",
      expect.objectContaining({ p_action: "test-ip", p_ip: "test-ip" }),
    );
  });

  it("blocks when the database count exceeds maxRequests", async () => {
    const key = "api:192.168.1.100";

    for (let i = 0; i < 100; i += 1) {
      await checkRateLimit(key);
    }

    const result = await checkRateLimit(key);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("returns the database-backed remaining count", async () => {
    const key = "api:192.168.1.101";

    await checkRateLimit(key);
    const result = await checkRateLimit(key);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(98);
  });

  it("returns rate-limit headers", async () => {
    const result = await checkRateLimit("test-ip-headers");

    expect(result.headers).toHaveProperty("X-RateLimit-Remaining");
    expect(result.headers).toHaveProperty("X-RateLimit-Reset");
    expect(result.headers).toHaveProperty("X-RateLimit-Limit", "100");
    expect(result.headers).toHaveProperty("Retry-After");
  });

  it("returns a positive retryAfter for an allowed request", async () => {
    const result = await checkRateLimit("test-ip-retry");

    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("tracks distinct keys independently through the database contract", async () => {
    const result1 = await checkRateLimit("independent-key-1");
    const result2 = await checkRateLimit("independent-key-2");

    expect(result1.remaining).toBe(99);
    expect(result2.remaining).toBe(99);
  });

  it("respects custom maxRequests", async () => {
    const first = await checkRateLimit("custom-limit", { windowMs: 60000, maxRequests: 2 });
    const second = await checkRateLimit("custom-limit", { windowMs: 60000, maxRequests: 2 });
    const blocked = await checkRateLimit("custom-limit", { windowMs: 60000, maxRequests: 2 });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it("parses action:ip keys correctly for the database RPC", async () => {
    const result = await checkApiRateLimit("agents-post:192.168.1.1");

    expect(result.allowed).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith(
      "increment_security_rate_limit",
      expect.objectContaining({ p_action: "agents-post", p_ip: "192.168.1.1" }),
    );
  });

  it("preserves colons in the action portion by splitting on the last colon", async () => {
    await checkApiRateLimit("api:auth:login:10.0.0.1");

    expect(mockRpc).toHaveBeenCalledWith(
      "increment_security_rate_limit",
      expect.objectContaining({ p_action: "api:auth:login", p_ip: "10.0.0.1" }),
    );
  });

  it("uses the full key as both action and IP when no colon exists", async () => {
    await checkApiRateLimit("192.168.1.1");

    expect(mockRpc).toHaveBeenCalledWith(
      "increment_security_rate_limit",
      expect.objectContaining({ p_action: "192.168.1.1", p_ip: "192.168.1.1" }),
    );
  });

  it("aligns resetTime to the selected window boundary", async () => {
    const now = Date.now();
    const result = await checkApiRateLimit("window-test-key", undefined, {
      windowMs: 60000,
      maxRequests: 100,
    });

    expect(result.resetTime % 60000).toBe(0);
    expect(result.resetTime).toBeGreaterThan(now);
    expect(result.resetTime).toBeLessThanOrEqual(now + 60000);
  });

  it("uses the requested authentication limit of 10", async () => {
    const result = await checkAuthRateLimit("auth-default");

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(9);
    expect(result.headers["X-RateLimit-Limit"]).toBe("10");
  });

  it("blocks authentication requests after 10 database increments", async () => {
    const key = "auth-block-test";

    for (let i = 0; i < 10; i += 1) {
      await checkAuthRateLimit(key);
    }

    const result = await checkAuthRateLimit(key);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("does not reset database-backed state when clearRateLimitStore is called", async () => {
    const key = "clear-test";

    await checkApiRateLimit(key);
    clearRateLimitStore();
    const result = await checkApiRateLimit(key);

    expect(result.remaining).toBe(98);
  });

  it("fails closed when the rate-limit database check fails", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "database unavailable" } });

    const result = await checkApiRateLimit("db-failure");

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBe(30);
    expect(result.headers["X-RateLimit-Remaining"]).toBe("0");
  });

  it("handles maxRequests of 1", async () => {
    const first = await checkApiRateLimit("single-request", undefined, {
      maxRequests: 1,
      windowMs: 60000,
    });
    const blocked = await checkApiRateLimit("single-request", undefined, {
      maxRequests: 1,
      windowMs: 60000,
    });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(0);
    expect(blocked.allowed).toBe(false);
  });

  it("handles very large maxRequests", async () => {
    const result = await checkApiRateLimit("large-limit", undefined, {
      maxRequests: 1000000,
      windowMs: 60000,
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(999999);
  });

  it("never reports a negative remaining value", async () => {
    const key = "negative-test";

    for (let i = 0; i < 110; i += 1) {
      await checkApiRateLimit(key, undefined, { maxRequests: 100, windowMs: 60000 });
    }

    const result = await checkApiRateLimit(key, undefined, { maxRequests: 100, windowMs: 60000 });

    expect(Number(result.headers["X-RateLimit-Remaining"])).toBeGreaterThanOrEqual(0);
    expect(result.remaining).toBe(0);
  });
});
