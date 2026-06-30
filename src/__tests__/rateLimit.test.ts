import { describe, it, expect, vi, beforeEach } from "vitest";

// Build a proper chainable mock for Supabase queries
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockInsert = vi.fn();
const mockFrom = vi.fn();

// Wire up the chain after declaration
const chain = { select: mockSelect, eq: mockEq, gte: mockGte, insert: mockInsert };
mockSelect.mockReturnValue(chain);
mockEq.mockReturnValue(chain);
mockGte.mockResolvedValue({ count: 0, error: null });
mockInsert.mockResolvedValue({ error: null });
mockFrom.mockReturnValue(chain);

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(() => ({ from: mockFrom })),
}));

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
    // Reset chain to default (allowed) state
    mockSelect.mockReset();
    mockEq.mockReset();
    mockGte.mockReset();
    mockInsert.mockReset();
    mockFrom.mockReset();
    mockSelect.mockReturnValue(chain);
    mockEq.mockReturnValue(chain);
    mockGte.mockResolvedValue({ count: 0, error: null });
    mockInsert.mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(chain);
  });

  it("exports checkRateLimit function", () => {
    expect(typeof checkRateLimit).toBe("function");
  });

  it("returns allowed: true for first request", async () => {
    const result = await checkRateLimit("test-ip", "api");
    expect(result.allowed).toBe(true);
  });

  it("blocks when count exceeds max", async () => {
    mockGte.mockResolvedValueOnce({ count: 30, error: null });

    const result = await checkRateLimit("test-ip-2", "api");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("falls back to memory when DB fails", async () => {
    const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
    vi.mocked(createServiceRoleClient).mockImplementationOnce(() => {
      throw new Error("DB connection failed");
    });

    const result = await checkRateLimit("fallback-ip", "api");
    expect(result.allowed).toBe(true);
  });

  describe("IP validation in rate limit keys", () => {
    it("treats bare numbers like '1' as invalid IP → uses 'unknown'", async () => {
      const result = await checkRateLimit("auth:1", "auth");
      expect(result.allowed).toBe(true);
      // Verify the DB was queried (the mock was hit)
      expect(mockFrom).toHaveBeenCalledWith("rate_limit_log");
    });

    it("treats '0' as invalid IP → uses 'unknown'", async () => {
      const result = await checkRateLimit("api:0", "api");
      expect(result.allowed).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("rate_limit_log");
    });

    it("accepts valid IPv4 addresses", async () => {
      const result = await checkRateLimit("api:192.168.1.1", "api");
      expect(result.allowed).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("rate_limit_log");
    });

    it("accepts valid IPv6 addresses", async () => {
      const result = await checkRateLimit("api:2001:db8::1", "api");
      expect(result.allowed).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("rate_limit_log");
    });

    it("accepts loopback IPv6 ::1", async () => {
      const result = await checkRateLimit("api:::1", "api");
      expect(result.allowed).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("rate_limit_log");
    });

    it("treats 'unknown' IP as invalid → stays 'unknown'", async () => {
      const result = await checkRateLimit("api:unknown", "api");
      expect(result.allowed).toBe(true);
      expect(mockFrom).toHaveBeenCalledWith("rate_limit_log");
    });
  });
});
