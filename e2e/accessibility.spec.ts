import { test, expect } from "@playwright/test";

test.describe("Accessibility - Keyboard Navigation", () => {
  test("should navigate explore page with keyboard", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.keyboard.press("Tab");
    const firstLink = page.locator("a[href*='/explore/']").first();
    if (await firstLink.count() > 0) {
      await expect(firstLink).toBeFocused();
    }
  });

  test("should navigate property detail images with arrow keys", async ({ page }) => {
    await page.goto("/ar/explore");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      await page.keyboard.press("Enter");
      const lightbox = page.locator('[role="dialog"][aria-modal="true"]');
      if (await lightbox.count() > 0) {
        await expect(lightbox).toBeVisible();
        await page.keyboard.press("ArrowLeft");
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("Escape");
        await expect(lightbox).not.toBeVisible();
      }
    }
  });
});

test.describe("Accessibility - RTL", () => {
  test("should have RTL attributes on Arabic pages", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should have LTR attributes on English pages", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("Accessibility - Skip Links", () => {
  test("should have skip to content link", async ({ page }) => {
    await page.goto("/ar");
    const skipLink = page.locator('a[href="#main-content"]');
    await expect(skipLink).toBeVisible();
    await skipLink.focus();
    await page.keyboard.press("Enter");
    const mainContent = page.locator("#main-content");
    await expect(mainContent).toBeFocused();
  });
});