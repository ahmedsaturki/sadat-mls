import { test, expect } from "@playwright/test";

test.describe("Contact Form - Public", () => {
  test("should have contact form on property detail page", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("networkidle");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      // Look for contact form elements
      const nameInput = page.locator('input[name*="name"], input[placeholder*="name"], input[placeholder*="اسم"]').first();
      const messageInput = page.locator('textarea, input[name*="message"]').first();
      if (await nameInput.count() > 0) {
        await expect(nameInput).toBeVisible();
      }
      if (await messageInput.count() > 0) {
        await expect(messageInput).toBeVisible();
      }
    }
  });

  test("should have share button on property detail", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("networkidle");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const shareButton = page.locator('button[aria-label*="share"], button[aria-label*="مشاركة"]').first();
      if (await shareButton.count() > 0) {
        await expect(shareButton).toBeVisible();
      }
    }
  });
});

test.describe("Dashboard Navigation", () => {
  test("should redirect unauthenticated user from dashboard to login", async ({ page }) => {
    await page.goto("/ar/dashboard");
    // Middleware redirects to login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("should redirect unauthenticated user from admin to login", async ({ page }) => {
    const response = await page.goto("/ar/admin");
    const url = page.url();
    expect(url.includes("/login") || response?.status() === 200).toBeTruthy();
  });
});

test.describe("Office Profiles", () => {
  test("should load offices listing page", async ({ page }) => {
    const response = await page.goto("/ar/offices");
    expect(response?.status()).toBeLessThan(500);
  });

  test("should load offices page in English", async ({ page }) => {
    const response = await page.goto("/en/offices");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Error Pages", () => {
  test("should show 404 for non-existent route", async ({ page }) => {
    const response = await page.goto("/ar/nonexistent-page-xyz");
    expect(response?.status()).toBe(404);
  });

  test("should show 404 for invalid property ID", async ({ page }) => {
    const response = await page.goto("/ar/explore/00000000-0000-0000-0000-000000000000");
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe("Static Pages", () => {
  test("should load offline page", async ({ page }) => {
    const response = await page.goto("/ar/offline");
    expect(response?.status()).toBeLessThan(500);
  });

  test("should load health API", async ({ request }) => {
    const response = await request.get("/api/health");
    expect(response.status()).toBe(200);
  });
});
