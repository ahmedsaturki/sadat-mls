import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUser = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockMaybeSingle = vi.fn();

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => ({
    auth: { getUser: mockGetUser },
    from: vi.fn(() => ({
      select: mockSelect,
    })),
  })),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

describe("withBackoff", () => {
  let withBackoff: typeof import("@/lib/supabase/auth-utils").withBackoff;

  beforeEach(async () => {
    vi.clearAllMocks();
    const mod = await import("@/lib/supabase/auth-utils");
    withBackoff = mod.withBackoff;
  });

  it("returns result on first attempt", async () => {
    const fn = vi.fn().mockResolvedValue("success");
    const result = await withBackoff(fn, 3, 1);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on 429 rate limit error", async () => {
    const error429 = Object.assign(new Error("rate limited"), { status: 429 });
    const fn = vi.fn()
      .mockRejectedValueOnce(error429)
      .mockResolvedValue("success");

    const result = await withBackoff(fn, 3, 1);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries on over_request_rate_limit code", async () => {
    const errorRate = Object.assign(new Error("rate limited"), { code: "over_request_rate_limit" });
    const fn = vi.fn()
      .mockRejectedValueOnce(errorRate)
      .mockResolvedValue("success");

    const result = await withBackoff(fn, 3, 1);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws non-rate-limit error immediately", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("network error"));
    await expect(withBackoff(fn, 3, 1)).rejects.toThrow("network error");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exhausts max retries on persistent 429", async () => {
    const error429 = Object.assign(new Error("rate limited"), { status: 429 });
    const fn = vi.fn().mockRejectedValue(error429);

    await expect(withBackoff(fn, 3, 1)).rejects.toThrow("rate limited");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("respects custom maxRetries=1", async () => {
    const error429 = Object.assign(new Error("rate limited"), { status: 429 });
    const fn = vi.fn().mockRejectedValue(error429);

    await expect(withBackoff(fn, 1, 1)).rejects.toThrow("rate limited");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("handles non-Error thrown values", async () => {
    const fn = vi.fn().mockRejectedValue("string error");
    await expect(withBackoff(fn, 3, 1)).rejects.toThrow("string error");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("getSupabaseClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a supabase client", async () => {
    const { getSupabaseClient } = await import("@/lib/supabase/auth-utils");
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("returns the same client on repeated calls (singleton)", async () => {
    const { getSupabaseClient } = await import("@/lib/supabase/auth-utils");
    const client1 = getSupabaseClient();
    const client2 = getSupabaseClient();
    expect(client1).toBe(client2);
  });
});

describe("clearAuthCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports clearAuthCache function", async () => {
    const { clearAuthCache } = await import("@/lib/supabase/auth-utils");
    expect(typeof clearAuthCache).toBe("function");
  });

  it("can be called without errors", async () => {
    const { clearAuthCache } = await import("@/lib/supabase/auth-utils");
    expect(() => clearAuthCache()).not.toThrow();
  });
});

describe("getUserWithDeduplication", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    const { clearAuthCache } = await import("@/lib/supabase/auth-utils");
    clearAuthCache();
  });

  it("returns null user when not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const { getUserWithDeduplication } = await import("@/lib/supabase/auth-utils");
    const result = await getUserWithDeduplication();

    expect(result.user).toBeNull();
    expect(result.profile).toBeNull();
  });

  it("returns user and profile when authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({
      data: { id: "user-123", email: "test@example.com", role: "office_agent" },
    });

    const { getUserWithDeduplication } = await import("@/lib/supabase/auth-utils");
    const result = await getUserWithDeduplication();

    expect(result.user).toEqual({ id: "user-123" });
    expect(result.profile).toEqual({
      id: "user-123",
      email: "test@example.com",
      role: "office_agent",
    });
  });

  it("returns null profile when user has no profile", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: null });

    const { getUserWithDeduplication } = await import("@/lib/supabase/auth-utils");
    const result = await getUserWithDeduplication();

    expect(result.user).toEqual({ id: "user-123" });
    expect(result.profile).toBeNull();
  });

  it("caches results and does not re-fetch within TTL", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: "user-123" } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { id: "user-123" } });

    const { getUserWithDeduplication, clearAuthCache } = await import("@/lib/supabase/auth-utils");
    clearAuthCache();

    await getUserWithDeduplication();
    await getUserWithDeduplication();

    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent requests (single getUser call)", async () => {
    let resolveGetUser!: (value: unknown) => void;
    const getUserPromise = new Promise((resolve) => { resolveGetUser = resolve; });
    mockGetUser.mockReturnValue(getUserPromise);

    const { getUserWithDeduplication, clearAuthCache } = await import("@/lib/supabase/auth-utils");
    clearAuthCache();

    const p1 = getUserWithDeduplication();
    const p2 = getUserWithDeduplication();

    resolveGetUser({ data: { user: { id: "user-123" } }, error: null });
    mockMaybeSingle.mockResolvedValue({ data: { id: "user-123" } });

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.user).toEqual({ id: "user-123" });
    expect(r2.user).toEqual({ id: "user-123" });
    expect(mockGetUser).toHaveBeenCalledTimes(1);
  });
});
