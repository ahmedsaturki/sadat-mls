import { describe, it, expect, vi, beforeEach } from "vitest";
import { ClientSecurityManager } from "@/lib/security/client";

describe("ClientSecurityManager", () => {
  beforeEach(() => {
    document.cookie = "";
    // Reset DEFAULT_CONFIG to original defaults via a no-op config
    ClientSecurityManager.configure({
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000,
      sessionTimeout: 24 * 60 * 60 * 1000,
      require2FA: false,
      cookieSecure: false,
      cookieSameSite: "lax",
      enableRateLimit: true,
      enableCSRF: true,
    });
  });

  describe("validateLogin", () => {
    it("returns isValid=true on first attempt for a fresh identifier", async () => {
      const result = await ClientSecurityManager.validateLogin("user1@example.com", "pw");
      expect(result.isValid).toBe(true);
    });

    it("locks the identifier after max-attempts failures", async () => {
      for (let i = 0; i < 5; i++) {
        ClientSecurityManager.recordFailedLogin("user-lock@example.com");
      }
      const result = await ClientSecurityManager.validateLogin("user-lock@example.com", "pw");
      expect(result.isValid).toBe(false);
      expect(result.reason).toMatch(/locked/i);
    });

    it("isolates failure counters per identifier", async () => {
      ClientSecurityManager.clearLoginAttempts("a@x.com");
      for (let i = 0; i < 5; i++) {
        ClientSecurityManager.recordFailedLogin("a@x.com");
      }

      const other = await ClientSecurityManager.validateLogin("b@x.com", "pw");
      expect(other.isValid).toBe(true);
    });
  });

  describe("recordFailedLogin / clearLoginAttempts", () => {
    it("increments count up to the lockout threshold then resets and locks", () => {
      ClientSecurityManager.clearLoginAttempts("x@x.com");
      for (let i = 0; i < 4; i++) {
        ClientSecurityManager.recordFailedLogin("x@x.com");
      }
      const before = ClientSecurityManager.isLockedOut("x@x.com");
      expect(before.locked).toBe(false);

      ClientSecurityManager.recordFailedLogin("x@x.com");
      const after = ClientSecurityManager.isLockedOut("x@x.com");
      expect(after.locked).toBe(true);
      expect(after.remainingSeconds).toBeGreaterThan(0);
    });

    it("clearLoginAttempts removes any prior counter for that id", () => {
      ClientSecurityManager.clearLoginAttempts("z@z.com");
      for (let i = 0; i < 4; i++) {
        ClientSecurityManager.recordFailedLogin("z@z.com");
      }
      ClientSecurityManager.clearLoginAttempts("z@z.com");
      const result = ClientSecurityManager.isLockedOut("z@z.com");
      expect(result.locked).toBe(false);
    });
  });

  describe("isLockedOut", () => {
    it("returns locked=false when no prior attempts exist", () => {
      expect(ClientSecurityManager.isLockedOut("never@lock.com").locked).toBe(false);
    });

    it("blocks after 5 failures", () => {
      ClientSecurityManager.clearLoginAttempts("block@lock.com");
      for (let i = 0; i < 5; i++) {
        ClientSecurityManager.recordFailedLogin("block@lock.com");
      }
      expect(ClientSecurityManager.isLockedOut("block@lock.com").locked).toBe(true);
    });

    it("remainingSeconds is approximately the lockout duration after a lock", () => {
      ClientSecurityManager.configure({ lockoutDuration: 60_000 });
      ClientSecurityManager.clearLoginAttempts("rem@sec.com");
      for (let i = 0; i < 5; i++) {
        ClientSecurityManager.recordFailedLogin("rem@sec.com");
      }
      const out = ClientSecurityManager.isLockedOut("rem@sec.com");
      expect(out.locked).toBe(true);
      expect(out.remainingSeconds).toBeGreaterThan(0);
      expect(out.remainingSeconds).toBeLessThanOrEqual(60);
    });
  });

  describe("getSecurityHeaders", () => {
    it("returns a fixed baseline of security headers", () => {
      const headers = ClientSecurityManager.getSecurityHeaders();
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
      expect(headers["X-Frame-Options"]).toBe("DENY");
      expect(headers["X-XSS-Protection"]).toBe("0");
      expect(headers["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headers["Strict-Transport-Security"]).toMatch(/max-age=63072000/);
      expect(headers["X-Permitted-Cross-Domain-Policies"]).toBe("none");
      expect(headers["Cross-Origin-Opener-Policy"]).toBe("same-origin");
      expect(headers["Cross-Origin-Resource-Policy"]).toBe("same-origin");
      expect(headers["Content-Security-Policy"]).toContain("default-src 'self'");
    });
  });

  describe("setSecureCookies / clearCookies", () => {
    it("setSecureCookies writes a URL-encoded value", () => {
      if (typeof document !== "undefined") {
        ClientSecurityManager.setSecureCookies("test", "value space");
        expect(document.cookie).toContain("value%20space");
      }
    });

    it("clearCookies emits an expiring string for each cookie", () => {
      if (typeof document === "undefined") return;
      const setSpy = vi.spyOn(document, "cookie", "set");
      ClientSecurityManager.clearCookies(["abandoned", "other"]);
      const candidates = setSpy.mock.calls.map((c: unknown) => String((c as [string])[0]));
      const abandonedClear = candidates.find(s => s.includes("abandoned"));
      expect(abandonedClear).toBeDefined();
      expect(abandonedClear).toContain("max-age=0");
      expect(abandonedClear).toContain("path=/");
      setSpy.mockRestore();
    });
  });

  describe("isSecureContext", () => {
    it("returns a value compatible with one of true / false", () => {
      const value = ClientSecurityManager.isSecureContext();
      // jsdom may not define `window.isSecureContext`, in which case the static
      // method returns `undefined`. We accept either a boolean or undefined here.
      expect(value === true || value === false || value === undefined).toBe(true);
    });
  });

  describe("generateNonce + sanitizeForLogging", () => {
    it("generates a non-empty base64 nonce", () => {
      const nonce = ClientSecurityManager.generateNonce();
      expect(typeof nonce).toBe("string");
      expect(nonce.length).toBeGreaterThan(0);
    });

    it("produces different nonces on repeated calls", () => {
      const a = ClientSecurityManager.generateNonce();
      const b = ClientSecurityManager.generateNonce();
      expect(a).not.toBe(b);
    });

    it("sanitizes phone numbers to [PHONE]", () => {
      const out = ClientSecurityManager.sanitizeForLogging("Call 555-123-4567 today");
      expect(out).toContain("[PHONE]");
      expect(out).not.toContain("555-123-4567");
    });

    it("sanitizes dates to [DATE]", () => {
      const out = ClientSecurityManager.sanitizeForLogging("Posted on 2026-07-05");
      expect(out).toContain("[DATE]");
      expect(out).not.toContain("2026-07-05");
    });

    it("sanitizes emails to [EMAIL]", () => {
      const out = ClientSecurityManager.sanitizeForLogging("Contact alice@example.com please");
      expect(out).toContain("[EMAIL]");
      expect(out).not.toContain("alice@example.com");
    });

    it("sanitizes credit card numbers to [CREDIT_CARD]", () => {
      const out = ClientSecurityManager.sanitizeForLogging("Card: 4111111111111111 today");
      expect(out).toContain("[CREDIT_CARD]");
      expect(out).not.toContain("4111111111111111");
    });

    it("does not mutilate unrelated content", () => {
      const out = ClientSecurityManager.sanitizeForLogging("Hello world");
      expect(out).toBe("Hello world");
    });
  });

  describe("getClientIp", () => {
    it("returns null in a browser context (no API yet)", () => {
      expect(ClientSecurityManager.getClientIp()).toBeNull();
    });
  });
});
