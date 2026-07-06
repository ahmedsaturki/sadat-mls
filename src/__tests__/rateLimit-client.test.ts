import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimitClient } from "@/lib/security/rateLimit-client";

describe("RateLimitClient", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkRateLimit", () => {
    it("returns parsed rate-limit info from a HEAD response", async () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "47");
      headers.set("X-RateLimit-Reset", "1700000000");
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(null, { status: 200, headers }),
      );

      const client = new RateLimitClient();
      const info = await client.checkRateLimit("/api/contact");
      expect(info.remaining).toBe(47);
      expect(info.reset).toBe(1700000000);
      expect(info.retryAfter).toBeUndefined();
    });

    it("parses Retry-After when present", async () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "0");
      headers.set("X-RateLimit-Reset", "1700000000");
      headers.set("Retry-After", "120");
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(null, { status: 429, headers }),
      );

      const client = new RateLimitClient();
      const info = await client.checkRateLimit("/api/contact");
      expect(info.remaining).toBe(0);
      expect(info.retryAfter).toBe(120);
    });

    it("returns a safe default on network failure", async () => {
      vi.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));
      const client = new RateLimitClient();
      const info = await client.checkRateLimit("/api/contact");
      expect(info.remaining).toBe(-1);
      expect(info.reset).toBeGreaterThan(0);
    });

    it("warns when remaining is below 20", async () => {
      const headers = new Headers();
      headers.set("X-RateLimit-Remaining", "10");
      headers.set("X-RateLimit-Reset", "1700000000");
      vi.spyOn(global, "fetch").mockResolvedValue(
        new Response(null, { status: 200, headers }),
      );

      const client = new RateLimitClient();
      await client.checkRateLimit("/api/contact");
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("getClientKey", () => {
    it("returns a stable hash for the same endpoint", () => {
      const client = new RateLimitClient();
      const a = client.getClientKey("/api/x");
      const b = client.getClientKey("/api/x");
      expect(a).toBe(b);
    });

    it("returns distinct hashes for different endpoints", () => {
      const client = new RateLimitClient();
      const a = client.getClientKey("/api/x");
      const b = client.getClientKey("/api/y");
      expect(a).not.toBe(b);
    });

    it("produces a 'rl.' prefixed key", () => {
      const client = new RateLimitClient();
      expect(client.getClientKey("/api/x").startsWith("rl.")).toBe(true);
    });
  });

  describe("shouldRetry", () => {
    const client = new RateLimitClient();

    it("returns false when maxRetries <= 0", () => {
      expect(client.shouldRetry({ status: 429 }, 0)).toBe(false);
    });

    it("returns true for status 429 with retry-after", () => {
      const headers = { get: (name: string) => (name === "Retry-After" ? "30" : null) };
      expect(client.shouldRetry({ status: 429, headers }, 3)).toBe(true);
    });

    it("returns true for 5xx", () => {
      expect(client.shouldRetry({ status: 500 }, 3)).toBe(true);
      expect(client.shouldRetry({ status: 502 }, 3)).toBe(true);
      expect(client.shouldRetry({ status: 599 }, 3)).toBe(true);
    });

    it("returns false for 4xx (other than 429)", () => {
      expect(client.shouldRetry({ status: 400 }, 3)).toBe(false);
      expect(client.shouldRetry({ status: 404 }, 3)).toBe(false);
    });

    it("returns false when no status is provided", () => {
      expect(client.shouldRetry({}, 3)).toBe(false);
    });
  });

  describe("getBackoffDelay", () => {
    const client = new RateLimitClient();

    it("doubles per attempt starting from the base", () => {
      expect(client.getBackoffDelay(0, 1000)).toBe(1000);
      expect(client.getBackoffDelay(1, 1000)).toBe(2000);
      expect(client.getBackoffDelay(2, 1000)).toBe(4000);
      expect(client.getBackoffDelay(3, 1000)).toBe(8000);
    });

    it("caps the delay at 30 seconds", () => {
      expect(client.getBackoffDelay(10, 1000)).toBe(30000);
    });
  });
});
