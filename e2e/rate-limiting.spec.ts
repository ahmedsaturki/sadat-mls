import { test, expect, type APIResponse } from "@playwright/test";

async function healthBurst(request: Parameters<Parameters<typeof test>[1]>[0]["request"], ip: string): Promise<APIResponse[]> {
  return Promise.all(
    Array.from({ length: 105 }, () =>
      request.get("/api/health", {
        headers: { "x-forwarded-for": ip },
      }),
    ),
  );
}

test.describe("Rate Limiting", () => {
  test.describe.configure({ timeout: 90_000 });

  test("health endpoint returns 200 or 503 for a normal request", async ({ request }) => {
    const response = await request.get("/api/health", {
      headers: { "x-forwarded-for": "198.51.100.10" },
    });
    expect([200, 503]).toContain(response.status());
  });

  test("health endpoint returns 429 with rate-limit metadata after the quota is exceeded", async ({ request }) => {
    const responses = await healthBurst(request, "198.51.100.11");
    const rateLimited = responses.find((response) => response.status() === 429);
    expect(rateLimited).toBeDefined();

    const headers = rateLimited!.headers();
    expect(headers["retry-after"]).toBeTruthy();
    expect(headers["x-ratelimit-remaining"]).toBe("0");

    const body = await rateLimited!.json();
    expect(body.error).toBe("Too many requests");
    expect(body.status).toBe("error");
  });

  test("contact endpoint enforces CSRF before rate limiting", async ({ request }) => {
    const response = await request.post("/api/contact", {
      data: {
        contactType: "email",
        visitorName: "Test User",
        message: "Test message for rate limit verification",
      },
    });
    expect(response.status()).toBe(403);
  });

  test("retired notifications endpoint stays unavailable", async ({ request }) => {
    const response = await request.get("/api/notifications");
    expect(response.status()).toBe(404);
  });

  test("429 responses preserve the error contract", async ({ request }) => {
    const responses = await healthBurst(request, "198.51.100.12");
    const rateLimited = responses.filter((response) => response.status() === 429);
    expect(rateLimited.length).toBeGreaterThan(0);

    for (const response of rateLimited) {
      const body = await response.json();
      expect(body).toHaveProperty("error", "Too many requests");
      expect(typeof body.error).toBe("string");

      const headers = response.headers();
      expect(headers["retry-after"]).toBeTruthy();
    }
  });
});
