import { test, expect } from "@playwright/test";

test.describe("Security Headers", () => {
  test("should have CSP header", async ({ request }) => {
    const response = await request.get("/");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toBeTruthy();
    expect(csp).toContain("script-src");
  });

  test("should have X-Frame-Options blocking framing", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-frame-options"]).toBe("DENY");
  });

  test("should have X-Content-Type-Options nosniff", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
  });

  test("should have XSS Protection header disabled in favor of CSP", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["x-xss-protection"]).toBe("0");
  });

  test("should have Referrer-Policy header", async ({ request }) => {
    const response = await request.get("/");
    expect(response.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("should have HSTS header", async ({ request }) => {
    const response = await request.get("/");
    const hsts = response.headers()["strict-transport-security"];
    expect(hsts).toContain("max-age=");
  });

  test("should have CSP report-uri directive", async ({ request }) => {
    const response = await request.get("/");
    const csp = response.headers()["content-security-policy"];
    expect(csp).toContain("report-uri");
  });
});

test.describe("XSS Prevention", () => {
  test("should sanitize JSON-LD structured data", async ({ page }) => {
    await page.goto("/ar/explore");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const jsonLd = page.locator('script[type="application/ld+json"]');
      if (await jsonLd.count() > 0) {
        const content = await jsonLd.textContent();
        expect(content).not.toContain("<script>");
        expect(content).not.toContain("javascript:");
        expect(content).not.toContain("onerror");
      }
    }
  });
});