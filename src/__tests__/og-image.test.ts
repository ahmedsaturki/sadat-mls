import { describe, it, expect, vi } from "vitest";

vi.mock("next/server", () => ({
  ImageResponse: class MockImageResponse {
    constructor() {}
    static async render() {
      return new Response("mock-png-data", {
        headers: { "content-type": "image/png" },
      });
    }
  },
}));

vi.mock("next/navigation", () => ({}));

vi.mock("@/i18n/config", () => ({
  locales: ["ar", "en"],
}));

vi.mock("@/i18n/getMessages", () => ({
  getMessages: () => Promise.resolve({
    common: {},
    explore: {},
  }),
}));

describe("OG Image API Route", () => {
  it("should export a GET handler", async () => {
    const { GET } = await import("@/app/og-image/route");
    expect(GET).toBeDefined();
    expect(typeof GET).toBe("function");
  });

  it("should return PNG content type", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.headers?.get("content-type")).toContain("image/png");
  });

  it("should respond to search params for title", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image?text=Test%20Property");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it("should support locale parameter", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image?locale=en");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it("should handle missing text parameter", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it("should handle both text and locale parameters", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image?text=Villa&locale=ar");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it("should handle empty text parameter", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image?text=");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });

  it("should handle special characters in text", async () => {
    const { GET } = await import("@/app/og-image/route");

    const mockRequest = new Request("http://localhost/og-image?text=%3Cscript%3Ealert(1)%3C/script%3E");
    const response = await GET(mockRequest as any);

    expect(response).toBeDefined();
    expect(response.status).toBe(200);
  });
});
