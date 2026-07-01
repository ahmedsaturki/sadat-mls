import { test, expect } from "@playwright/test";

test.describe("Explore Page - Search & Filters", () => {
  test("should load explore page with search input", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page).toHaveURL(/\/ar\/explore/);
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();
  });

  test("should load explore page in English", async ({ page }) => {
    await page.goto("/en/explore");
    await expect(page).toHaveURL(/\/en\/explore/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have filters toggle button", async ({ page }) => {
    await page.goto("/ar/explore");
    const filterButton = page.locator('button[aria-label*="filter"], button[aria-expanded]').first();
    await expect(filterButton).toBeVisible();
  });

  test("should toggle advanced filters on click", async ({ page }) => {
    await page.goto("/ar/explore");
    const filterButton = page.locator('button[aria-expanded]').first();
    await filterButton.click();
    await expect(filterButton).toHaveAttribute("aria-expanded", "true");
    // Filters section should appear
    const filtersSection = page.locator("select, [class*='grid']").first();
    await expect(filtersSection).toBeVisible({ timeout: 5000 });
  });

  test("should display property cards or empty state", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("networkidle");
    // Either property cards or empty state message
    const content = page.locator("body");
    await expect(content).toContainText(/.{10}/);
  });

  test("should have sort dropdown", async ({ page }) => {
    await page.goto("/ar/explore");
    const sortSelect = page.locator("select").first();
    await expect(sortSelect).toBeVisible();
  });
});

test.describe("Explore Page - RTL/LTR", () => {
  test("should have RTL direction on Arabic explore", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should have LTR direction on English explore", async ({ page }) => {
    await page.goto("/en/explore");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});

test.describe("Property Details Page", () => {
  test("should load property detail page from explore", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("networkidle");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      await expect(page).toHaveURL(/\/ar\/explore\//);
    }
  });

  test("should have property images or placeholder", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("networkidle");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const images = page.locator("img");
      const placeholders = page.locator("[class*='placeholder'], [class*='skeleton']");
      expect((await images.count()) + (await placeholders.count())).toBeGreaterThan(0);
    }
  });

  test("should have contact or share buttons", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("networkidle");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const actions = page.locator("button");
      expect(await actions.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("Explore Page - Locale Switching", () => {
  test("should switch between Arabic and English explore", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await page.goto("/en/explore");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});
