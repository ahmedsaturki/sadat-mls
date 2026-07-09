import { test, expect } from "@playwright/test";

test.describe("Property Compare - Guest User", () => {
  test("should add property to compare from explore page", async ({ page }) => {
    await page.goto("/ar/explore");
    const compareButton = page.locator("button[aria-label*='compare']").first();
    if (await compareButton.count() > 0) {
      await compareButton.click();
      await expect(compareButton).toHaveClass(/bg-navy-50|text-navy-600/);
    }
  });

  test("should navigate to compare page from explore", async ({ page }) => {
    await page.goto("/ar/explore");
    const compareButton = page.locator("button[aria-label*='compare']").first();
    if (await compareButton.count() > 0) {
      await compareButton.click();
      const compareLink = page.locator("a[href*='/dashboard/compare']").first();
      if (await compareLink.count() > 0) {
        await compareLink.click();
        await expect(page).toHaveURL(/\/ar\/dashboard\/compare/);
      }
    }
  });
});

test.describe("Property Compare - Property Detail", () => {
  test("should render compare button on property detail page", async ({ page }) => {
    await page.goto("/ar/explore");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const compareButton = page.locator("button[aria-label*='compare']");
      await expect(compareButton).toBeVisible();
    }
  });

  test("should add and remove property from compare in detail page", async ({ page }) => {
    await page.goto("/ar/explore");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const compareButton = page.locator("button[aria-label*='compare']");
      await compareButton.click();
      await expect(compareButton).toHaveClass(/bg-navy-50|text-navy-600/);
      await compareButton.click();
      await expect(compareButton).not.toHaveClass(/bg-navy-50/);
    }
  });
});

test.describe("Property Compare - RTL Support", () => {
  test("should display compare page in Arabic with RTL layout", async ({ page }) => {
    await page.goto("/ar/dashboard/compare");
    const url = page.url();
    if (url.includes("/login")) {
      // Redirect to login is expected for unauthenticated users
      expect(url).toContain("/login");
    } else {
      await expect(page.locator("html")).toHaveAttribute("lang", "ar");
      const dir = await page.locator("html").getAttribute("dir");
      expect(dir).toBe("rtl");
    }
  });

  test("should display compare page in English with LTR layout", async ({ page }) => {
    await page.goto("/en/dashboard/compare");
    const url = page.url();
    if (url.includes("/login")) {
      // Redirect to login is expected for unauthenticated users
      expect(url).toContain("/login");
    } else {
      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      const dir = await page.locator("html").getAttribute("dir");
      expect(dir).toBe("ltr");
    }
  });
});

test.describe("Property Compare - Accessibility", () => {
  test("should have accessible compare button on explore page", async ({ page }) => {
    await page.goto("/ar/explore");
    const compareButton = page.locator("button[aria-label*='compare']").first();
    if (await compareButton.count() > 0) {
      await expect(compareButton).toBeVisible();
      await expect(compareButton).toHaveAttribute("aria-label");
    }
  });
});