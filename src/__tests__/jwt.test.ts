import { describe, it, expect, vi } from "vitest";

// Set JWT_SECRET before the module is imported (it throws at load time if missing)
process.env.JWT_SECRET = "test-secret-key-for-testing-only";

// Mock "server-only" so the import doesn't throw in vitest
vi.mock("server-only", () => ({}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

const { JwtService } = await import("@/lib/auth/jwt");

/**
 * Helper to build a fake JWT from a payload.
 * No signature verification — mirrors the module's own decode behaviour.
 */
function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "none", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fake-sig`;
}

describe("JwtService", () => {
  // ── decode ────────────────────────────────────────────

  describe("decode", () => {
    it("decodes a valid JWT with all fields", () => {
      const token = makeJwt({
        userId: "u1",
        email: "test@example.com",
        role: "office_agent",
        officeId: "o1",
        exp: 9999999999,
        iat: 1000000000,
      });
      const result = JwtService.decode(token);
      expect(result).toEqual({
        userId: "u1",
        email: "test@example.com",
        role: "office_agent",
        officeId: "o1",
        exp: 9999999999,
        iat: 1000000000,
      });
    });

    it("returns null when userId is missing", () => {
      const token = makeJwt({ email: "a@b.com", role: "office_agent" });
      expect(JwtService.decode(token)).toBeNull();
    });

    it("returns null when email is missing", () => {
      const token = makeJwt({ userId: "u1", role: "office_agent" });
      expect(JwtService.decode(token)).toBeNull();
    });

    it("returns null when role is missing", () => {
      const token = makeJwt({ userId: "u1", email: "a@b.com" });
      expect(JwtService.decode(token)).toBeNull();
    });

    it("returns null for malformed base64", () => {
      const token = "header.!!!invalid-base64!!!.sig";
      expect(JwtService.decode(token)).toBeNull();
    });

    it("returns null for a token with fewer than 3 parts", () => {
      expect(JwtService.decode("only.two")).toBeNull();
    });

    it("returns null for a completely empty string", () => {
      expect(JwtService.decode("")).toBeNull();
    });

    it("decodes a token with optional officeId omitted", () => {
      const token = makeJwt({ userId: "u1", email: "a@b.com", role: "office_agent" });
      const result = JwtService.decode(token);
      expect(result).not.toBeNull();
      expect(result!.officeId).toBeUndefined();
    });
  });

  // ── isValid ───────────────────────────────────────────

  describe("isValid", () => {
    it("returns true for a valid non-expired token", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJwt({
        userId: "u1",
        email: "a@b.com",
        role: "office_agent",
        exp: futureExp,
      });
      expect(JwtService.isValid(token)).toBe(true);
    });

    it("returns false for an expired token", () => {
      const token = makeJwt({
        userId: "u1",
        email: "a@b.com",
        role: "office_agent",
        exp: 1, // 1970
      });
      expect(JwtService.isValid(token)).toBe(false);
    });

    it("returns false when token has no exp field", () => {
      const token = makeJwt({ userId: "u1", email: "a@b.com", role: "office_agent" });
      expect(JwtService.isValid(token)).toBe(false);
    });
  });

  // ── getUserFromToken ──────────────────────────────────

  describe("getUserFromToken", () => {
    it("returns the payload for a valid, non-expired token", () => {
      const futureExp = Math.floor(Date.now() / 1000) + 3600;
      const token = makeJwt({
        userId: "u1",
        email: "a@b.com",
        role: "office_agent",
        exp: futureExp,
      });
      const user = JwtService.getUserFromToken(token);
      expect(user).not.toBeNull();
      expect(user!.userId).toBe("u1");
    });

    it("returns null for an expired token", () => {
      const token = makeJwt({
        userId: "u1",
        email: "a@b.com",
        role: "office_agent",
        exp: 1,
      });
      expect(JwtService.getUserFromToken(token)).toBeNull();
    });

    it("returns null for a completely invalid token", () => {
      expect(JwtService.getUserFromToken("garbage")).toBeNull();
    });
  });
});
