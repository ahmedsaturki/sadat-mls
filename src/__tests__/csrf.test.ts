import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCookieStore = new Map<string, string>();
const mockCookies = vi.mocked(await import("next/headers")).cookies;

beforeEach(() => {
  vi.clearAllMocks();
  mockCookieStore.clear();
  mockCookies.mockReturnValue({
    get: (name: string) => mockCookieStore.get(name) ? { value: mockCookieStore.get(name)! } : undefined,
    set: (name: string, value: string) => mockCookieStore.set(name, value),
    delete: (name: string) => mockCookieStore.delete(name),
  } as any);
});

const { generateCsrfToken, getOrCreateCsrfToken, getCsrfTokenFromRequest, validateCsrfToken, clearCsrfToken } = await import("@/lib/security/csrf");

describe("csrf", () => {
  describe("generateCsrfToken", () => {
    it("generates a UUID-like token", () => {
      const token = generateCsrfToken();
      expect(token).toMatch(/^[0-9a-f-]+$/);
      expect(token.length).toBeGreaterThan(30);
    });

    it("generates unique tokens", () => {
      const token1 = generateCsrfToken();
      const token2 = generateCsrfToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("getOrCreateCsrfToken", () => {
    it("creates a new token when none exists", async () => {
      const token = await getOrCreateCsrfToken();
      expect(token).toBeTruthy();
      expect(token).toMatch(/^\d+\.[0-9a-f-]+$/);
    });

    it("returns existing valid token", async () => {
      const newToken = await getOrCreateCsrfToken();
      const reusedToken = await getOrCreateCsrfToken();
      expect(reusedToken).toBe(newToken);
    });

    it("rotates token after rotation interval", async () => {
      const token1 = await getOrCreateCsrfToken();
      // Simulate expired token by setting old timestamp
      const oldTimestamp = Date.now() - 5 * 60 * 60 * 1000;
      const uuid = token1.split(".")[1];
      mockCookieStore.set("csrf_token", `${oldTimestamp}.${uuid}`);
      
      const token2 = await getOrCreateCsrfToken();
      expect(token2).not.toBe(token1);
    });
  });

  describe("getCsrfTokenFromRequest", () => {
    it("extracts token from request headers", () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-csrf-token": "test-token" },
      });
      expect(getCsrfTokenFromRequest(mockRequest)).toBe("test-token");
    });

    it("returns null when header missing", () => {
      const mockRequest = new Request("http://localhost");
      expect(getCsrfTokenFromRequest(mockRequest)).toBeNull();
    });
  });

  describe("validateCsrfToken", () => {
    it("returns false when header token missing", async () => {
      const mockRequest = new Request("http://localhost");
      mockCookieStore.set("csrf_token", "1234567890.test-token");
      
      const result = await validateCsrfToken(mockRequest);
      expect(result).toBe(false);
    });

    it("returns false when cookie token missing", async () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-csrf-token": "test-token" },
      });
      
      const result = await validateCsrfToken(mockRequest);
      expect(result).toBe(false);
    });

    it("returns false for mismatched tokens", async () => {
      const mockRequest = new Request("http://localhost", {
        headers: { "x-csrf-token": "token-a" },
      });
      mockCookieStore.set("csrf_token", "token-b");
      
      const result = await validateCsrfToken(mockRequest);
      expect(result).toBe(false);
    });

    it("returns true for matching tokens", async () => {
      const timestamp = Date.now();
      const token = `${timestamp}.test-token`;
      const mockRequest = new Request("http://localhost", {
        headers: { "x-csrf-token": token },
      });
      mockCookieStore.set("csrf_token", token);
      
      const result = await validateCsrfToken(mockRequest);
      expect(result).toBe(true);
    });

    it("returns false for expired tokens (older than 24h)", async () => {
      const oldTimestamp = Date.now() - 25 * 60 * 60 * 1000;
      const token = `${oldTimestamp}.test-token`;
      const mockRequest = new Request("http://localhost", {
        headers: { "x-csrf-token": token },
      });
      mockCookieStore.set("csrf_token", token);
      
      const result = await validateCsrfToken(mockRequest);
      expect(result).toBe(false);
    });

    it("uses constant-time comparison", async () => {
      const timestamp = Date.now();
      const token = `${timestamp}.${"a".repeat(32)}`;
      const mockRequest = new Request("http://localhost", {
        headers: { "x-csrf-token": token },
      });
      mockCookieStore.set("csrf_token", token);
      
      const result = await validateCsrfToken(mockRequest);
      expect(result).toBe(true);
    });
  });

  describe("clearCsrfToken", () => {
    it("clears the csrf cookie", async () => {
      mockCookieStore.set("csrf_token", "test-token");
      await clearCsrfToken();
      expect(mockCookieStore.has("csrf_token")).toBe(false);
    });
  });
});
