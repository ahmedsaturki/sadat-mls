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

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve({ from: mockFrom })),
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
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockRejectedValueOnce(new Error("DB connection failed"));

    const result = await checkRateLimit("fallback-ip", "api");
    expect(result.allowed).toBe(true);
  });
});
