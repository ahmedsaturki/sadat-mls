import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockWarn = vi.fn();
const mockError = vi.fn();
const mockCheckApiRateLimit = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockWarn,
    error: mockError,
  },
}));

vi.mock("@/lib/security/rateLimit", () => ({
  checkApiRateLimit: mockCheckApiRateLimit,
}));

describe("CSP Report Endpoint", () => {
  let POST: typeof import("@/app/api/csp-report/route").POST;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockCheckApiRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 60000,
      retryAfter: 60,
      headers: { "X-RateLimit-Remaining": "99" },
    });
    const routeModule = await import("@/app/api/csp-report/route");
    POST = routeModule.POST;
  });

  it("exists and exports POST handler", async () => {
    const routeModule = await import("@/app/api/csp-report/route");
    expect(typeof routeModule.POST).toBe("function");
  });

  it("returns 429 when rate limiting denies the request", async () => {
    mockCheckApiRateLimit.mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 30000,
      retryAfter: 30,
      headers: { "Retry-After": "30" },
    });

    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify({ "csp-report": { "violated-directive": "script-src" } }),
      headers: { "content-type": "application/json", "x-forwarded-for": "192.168.1.1" },
    });

    const response = await POST(request);
    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({ error: "Too many requests" });
  });

  it("handles valid CSP report request", async () => {
    const report = {
      "csp-report": {
        "document-uri": "https://example.com",
        "violated-directive": "script-src",
      },
    };

    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify(report),
      headers: {
        "content-type": "application/json",
        "user-agent": "TestBot/1.0",
        "x-forwarded-for": "192.168.1.1",
      },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.status).toBe("received");
    expect(mockCheckApiRateLimit).toHaveBeenCalledWith("csp-report:192.168.1.1");
  });

  it("logs CSP violation via logger.warn", async () => {
    const report = {
      "csp-report": {
        "document-uri": "https://example.com",
        "violated-directive": "script-src",
      },
    };

    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify(report),
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1" },
    });

    await POST(request);
    expect(mockWarn).toHaveBeenCalledWith(
      "CSP Violation Report",
      expect.objectContaining({ cspReport: report["csp-report"] }),
    );
  });

  it("returns 400 for invalid JSON body", async () => {
    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: "not json",
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("returns 400 for non-object body", async () => {
    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify("just a string"),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it("handles report without csp-report wrapper key", async () => {
    const report = {
      "document-uri": "https://example.com",
      "violated-directive": "script-src",
    };

    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify(report),
      headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.2" },
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(mockWarn).toHaveBeenCalledWith(
      "CSP Violation Report",
      expect.objectContaining({ cspReport: report }),
    );
  });

  it("extracts IP from x-forwarded-for", async () => {
    const report = { "csp-report": { "violated-directive": "style-src" } };

    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify(report),
      headers: {
        "content-type": "application/json",
        "x-forwarded-for": "172.16.0.1, 10.0.0.1",
      },
    });

    await POST(request);
    expect(mockWarn).toHaveBeenCalledWith(
      "CSP Violation Report",
      expect.objectContaining({ ip: "172.16.0.1" }),
    );
    expect(mockCheckApiRateLimit).toHaveBeenCalledWith("csp-report:172.16.0.1");
  });

  it("handles missing x-forwarded-for header", async () => {
    const report = { "csp-report": { "violated-directive": "img-src" } };

    const request = new NextRequest("https://example.com/api/csp-report", {
      method: "POST",
      body: JSON.stringify(report),
      headers: { "content-type": "application/json" },
    });

    await POST(request);
    expect(mockWarn).toHaveBeenCalledWith(
      "CSP Violation Report",
      expect.objectContaining({ ip: "unknown" }),
    );
    expect(mockCheckApiRateLimit).toHaveBeenCalledWith("csp-report:unknown");
  });
});
