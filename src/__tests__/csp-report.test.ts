import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

const mockWarn = vi.fn();
const mockError = vi.fn();

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: mockWarn,
    error: mockError,
  },
}));

describe("CSP Report Endpoint", () => {
  it("exists and exports POST handler", async () => {
    const routeModule = await import("@/app/api/csp-report/route");
    expect(typeof routeModule.POST).toBe("function");
  });

  it("handles valid CSP report request", async () => {
    const routeModule = await import("@/app/api/csp-report/route");
    
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

    const response = await routeModule.POST(request);
    expect(response.status).toBe(200);
  });
});
