import { test, expect, type APIResponse } from "@playwright/test";

test.describe("Rate Limiting", () => {
  test.describe("Health API Rate Limiting", () => {
    test("should return 200 for normal requests", async ({ request }) => {
      const response = await request.get("/api/health");
      // Health endpoint returns 200 (or 503 if Supabase is unavailable).
      expect([200, 503]).toContain(response.status());
    });

    test("should return 429 with rate limit headers when exceeded", async ({ request }) => {
      // Health endpoint has 100 req/60s limit.
      // Send requests sequentially to ensure they hit the same counter.
      const responses: APIResponse[] = [];
      for (let i = 0; i < 105; i += 1) {
        responses.push(await request.get("/api/health"));
      }

      const statusCodes = responses.map((r) => r.status());

      // At least one response should be 429.
      const has429 = statusCodes.includes(429);
      expect(has429).toBeTruthy();

      const rateLimited = responses.find((r) => r.status() === 429);
      if (rateLimited) {
        const headers = rateLimited.headers();
        expect(headers["retry-after"]).toBeTruthy();
        expect(headers["x-ratelimit-remaining"]).toBe("0");

        const body = await rateLimited.json();
        expect(body.error).toBeTruthy();
      }
    });

    test("should include rate limit info in 429 response body", async ({ request }) => {
      const responses: APIResponse[] = [];
      for (let i = 0; i < 105; i += 1) {
        responses.push(await request.get("/api/health"));
      }

      const rateLimited = responses.find((r) => r.status() === 429);

      if (rateLimited) {
        const body = await rateLimited.json();
        expect(body.error).toBe("Too many requests");
        expect(body.status).toBe("error");
      }
    });
  });

  test.describe("Contact API Rate Limiting", () => {
    test("should enforce CSRF before rate limiting", async ({ request }) => {
      // Contact endpoint: 5 requests per hour.
      // Without CSRF token, should get 403 (CSRF checked first).
      const response = await request.post("/api/contact", {
        data: {
          contactType: "email",
          visitorName: "Test User",
          message: "Test message for rate limit verification",
        },
      });

      expect(response.status()).toBe(403);
    });
  });

  test.describe("Retired Notifications API", () => {
    test("should keep the retired notifications endpoint unavailable", async ({ request }) => {
      const response = await request.get("/api/notifications");
      // The legacy notifications surface has no verified Aqarat OS backing contract.
      expect(response.status()).toBe(404);
    });
  });

  test.describe("Rate Limit Response Format", () => {
    test("429 responses should have consistent error format", async ({ request }) => {
      const responses: APIResponse[] = [];
      for (let i = 0; i < 105; i += 1) {
        responses.push(await request.get("/api/health"));
      }

      const rateLimited = responses.filter((r) => r.status() === 429);

      for (const response of rateLimited) {
        const body = await response.json();
        expect(body).toHaveProperty("error");
        expect(typeof body.error).toBe("string");

        const headers = response.headers();
        expect(headers["retry-after"]).toBeTruthy();
      }
    });
  });
});
