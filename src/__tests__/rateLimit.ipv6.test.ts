import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockPublicRateLimit } = vi.hoisted(() => ({
  mockPublicRateLimit: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/security/publicRateLimit", () => ({
  checkPublicRateLimit: mockPublicRateLimit,
  isPublicRateLimitAction: (action: string) => action === "login",
}));



const { checkAuthRateLimit } = await import("@/lib/security/rateLimit");

describe("rateLimit IPv6 key parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPublicRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 4,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
      unavailable: false,
      headers: {},
    });
  });

  it("preserves a loopback IPv6 address as the IP portion", async () => {
    const result = await checkAuthRateLimit("login:::1");

    expect(result.allowed).toBe(true);
    expect(mockPublicRateLimit).toHaveBeenCalledWith("login", "::1");
  });

  it("preserves a full IPv6 address as the IP portion", async () => {
    await checkAuthRateLimit("login:2001:db8:85a3::8a2e:370:7334");

    expect(mockPublicRateLimit).toHaveBeenCalledWith(
      "login",
      "2001:db8:85a3::8a2e:370:7334",
    );
  });
});
