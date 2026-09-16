import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    rpc: mockRpc,
    from: vi.fn(),
  }),
}));

const { checkAuthRateLimit } = await import("@/lib/security/rateLimit");

describe("rateLimit IPv6 key parsing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRpc.mockResolvedValue({ data: 1, error: null });
  });

  it("preserves a loopback IPv6 address as the IP portion", async () => {
    const result = await checkAuthRateLimit("login:::1");

    expect(result.allowed).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith(
      "increment_security_rate_limit",
      expect.objectContaining({
        p_action: "login",
        p_ip: "::1",
      }),
    );
  });

  it("preserves a full IPv6 address as the IP portion", async () => {
    await checkAuthRateLimit("login:2001:db8:85a3::8a2e:370:7334");

    expect(mockRpc).toHaveBeenCalledWith(
      "increment_security_rate_limit",
      expect.objectContaining({
        p_action: "login",
        p_ip: "2001:db8:85a3::8a2e:370:7334",
      }),
    );
  });
});
