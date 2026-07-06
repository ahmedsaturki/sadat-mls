import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  getCsrfToken,
  getCsrfHeaders,
  CSRFClient,
} from "@/lib/security/csrf-client";
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from "@/lib/security/csrf-constants";

function setCookie(name: string, value: string | null) {
  if (typeof document === "undefined") return;
  if (value === null) {
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  } else {
    document.cookie = `${name}=${value}; Path=/`;
  }
}

describe("getCsrfToken / getCsrfHeaders", () => {
  beforeEach(() => setCookie(CSRF_COOKIE_NAME, null));

  it("returns null when no cookie is set", () => {
    expect(getCsrfToken()).toBeNull();
    expect(getCsrfHeaders()).toEqual({});
  });

  it("returns the token when the cookie is set", () => {
    setCookie(CSRF_COOKIE_NAME, "abc-123");
    expect(getCsrfToken()).toBe("abc-123");
    expect(getCsrfHeaders()).toEqual({ [CSRF_HEADER_NAME]: "abc-123" });
  });

  it("isolates named cookie reads (does not match csrf-tokenV2)", () => {
    document.cookie = `${CSRF_COOKIE_NAME}v2=different; Path=/`;
    expect(getCsrfToken()).toBeNull();
  });
});

describe("CSRFClient singleton", () => {
  it("returns the same instance via getInstance()", () => {
    const a = CSRFClient.getInstance();
    const b = CSRFClient.getInstance();
    expect(a).toBe(b);
  });

  it("clearCache empties the cache", () => {
    const c = CSRFClient.getInstance();
    c.clearCache();
    expect(c.extractTokenFromCookie()).toBe(getCsrfToken());
  });

  it("extractTokenFromCookie mirrors getCsrfToken", () => {
    setCookie(CSRF_COOKIE_NAME, "xyz");
    const c = CSRFClient.getInstance();
    expect(c.extractTokenFromCookie()).toBe("xyz");
  });
});

describe("CSRFClient.validateToken", () => {
  beforeEach(() => setCookie(CSRF_COOKIE_NAME, null));

  it("returns false when there is no cookie token", async () => {
    const c = new CSRFClient({});
    await expect(c.validateToken("anything")).resolves.toBe(false);
  });

  it("returns false on length mismatch", async () => {
    setCookie(CSRF_COOKIE_NAME, "abcd");
    const c = new CSRFClient({});
    await expect(c.validateToken("abc")).resolves.toBe(false);
  });

  it("returns true on exact match (constant-time path)", async () => {
    setCookie(CSRF_COOKIE_NAME, "match-1");
    const c = new CSRFClient({});
    await expect(c.validateToken("match-1")).resolves.toBe(true);
  });

  it("returns false on length-equal mismatch", async () => {
    setCookie(CSRF_COOKIE_NAME, "match!");
    const c = new CSRFClient({});
    await expect(c.validateToken("match?")).resolves.toBe(false);
  });
});

describe("CSRFClient.enhanceRequest", () => {
  beforeEach(() => setCookie(CSRF_COOKIE_NAME, null));
  afterEach(() => vi.restoreAllMocks());

  it("uses the supplied customToken without falling back to fetch", async () => {
    setCookie(CSRF_COOKIE_NAME, "cookie-token");
    const c = new CSRFClient({});
    const original = new Request("https://example.com/api/x", { method: "POST" });

    const enhanced = await c.enhanceRequest(original, "override-token");
    expect(enhanced.headers.get(CSRF_HEADER_NAME)).toBe("override-token");
  });

  it("uses the cached token without re-fetching when one is set", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ token: "fetched-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const c = new CSRFClient({});
    await c.getToken(); // primes cache
    const original = new Request("https://example.com/api/x", { method: "POST" });

    const enhanced = await c.enhanceRequest(original);
    expect(enhanced.headers.get(CSRF_HEADER_NAME)).toBe("fetched-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("CSRFClient.getToken cache + dedup", () => {
  beforeEach(() => setCookie(CSRF_COOKIE_NAME, null));
  afterEach(() => vi.restoreAllMocks());

  it("caches successful fetches", async () => {
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify({ token: "fetched-1" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const c = new CSRFClient({});
    const t1 = await c.getToken();
    const t2 = await c.getToken();

    expect(t1).toBe("fetched-1");
    expect(t2).toBe("fetched-1");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("does not fetch twice in parallel (deduplication)", async () => {
    let pending: ((token: string) => void) | null = null as ((token: string) => void) | null;
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockImplementation(
        () =>
          new Promise<Response>((resolve) => {
            pending = (token: string) =>
              resolve(
                new Response(JSON.stringify({ token }), {
                  status: 200,
                  headers: { "Content-Type": "application/json" },
                }),
              );
          }),
      );

    const c = new CSRFClient({});
    const p1 = c.getToken();
    const p2 = c.getToken();
    pending?.("dedup-tok");
    const [t1, t2] = await Promise.all([p1, p2]);

    expect(t1).toBe("dedup-tok");
    expect(t2).toBe("dedup-tok");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws when the server returns non-OK status", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("server error", { status: 500 }),
    );
    const c = new CSRFClient({});
    await expect(c.getToken()).rejects.toThrow(/Failed to fetch/);
  });
});

describe("CSRFClient.ensureToken", () => {
  beforeEach(() => setCookie(CSRF_COOKIE_NAME, null));
  afterEach(() => vi.restoreAllMocks());

  it("returns the cookie token immediately when present", async () => {
    setCookie(CSRF_COOKIE_NAME, "cookie-tok");
    const c = new CSRFClient({});
    await expect(c.ensureToken()).resolves.toBe("cookie-tok");
  });

  it("falls back to a network fetch when no cookie is set", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "from-server" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const c = new CSRFClient({});
    await expect(c.ensureToken()).resolves.toBe("from-server");
  });
});
