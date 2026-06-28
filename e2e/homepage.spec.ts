import { test, expect } from "@playwright/test";

test.describe("Homepage", () => {
  test("should redirect to Arabic locale by default", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar/);
  });

  test("should load Arabic homepage", async ({ page }) => {
    await page.goto("/ar");
    await expect(page).toHaveTitle(/Sadat MLS Cloud/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load English homepage", async ({ page }) => {
    await page.goto("/en");
    await expect(page).toHaveTitle(/Sadat MLS Cloud/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should display main navigation", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("nav")).toBeVisible();
  });

  test("should have skip to content link for accessibility", async ({ page }) => {
    await page.goto("/ar");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeAttached();
  });
});

test.describe("Explore Page", () => {
  test("should load explore page in Arabic", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page).toHaveURL(/\/ar\/explore/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should load explore page in English", async ({ page }) => {
    await page.goto("/en/explore");
    await expect(page).toHaveURL(/\/en\/explore/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("Login Page", () => {
  test("should load login page", async ({ page }) => {
    await page.goto("/ar/login");
    await expect(page).toHaveURL(/\/ar\/login/);
  });

  test("should have email and password fields", async ({ page }) => {
    await page.goto("/ar/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

test.describe("Security Headers", () => {
  test("should have security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();

    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-xss-protection"]).toBe("1; mode=block");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toContain("max-age=");
  });

  test("should have CSP nonce header", async ({ request }) => {
    const response = await request.get("/");
    const nonce = response.headers()["x-nonce"];
    expect(nonce).toBeTruthy();
    expect(typeof nonce).toBe("string");
  });
});

test.describe("Offline Page", () => {
  test("should have offline page accessible", async ({ page }) => {
    const response = await page.goto("/ar/offline");
    expect(response?.status()).toBeLessThan(500);
  });
});
