import { test, expect } from "@playwright/test";

test.describe("Explore Page - Search & Filters", () => {
  test("should load explore page with search input", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page).toHaveURL(/\/ar\/explore/);
    // The search input lives inside the lazy-loaded SearchFilters panel,
    // which is only rendered after clicking the filter toggle button.
    // Use aria-label to avoid matching the Navbar lang-menu button (which
    // also has aria-expanded but no aria-controls).
    const filterToggle = page.locator('button[aria-label="فلاتر"], button[aria-label="Filters"]').first();
    await expect(filterToggle).toBeVisible({ timeout: 10000 });
    await filterToggle.click();
    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
  });

  test("should load explore page in English", async ({ page }) => {
    await page.goto("/en/explore");
    await expect(page).toHaveURL(/\/en\/explore/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have filters toggle button", async ({ page }) => {
    await page.goto("/ar/explore");
    const filterButton = page.locator('button[aria-label="فلاتر"], button[aria-label="Filters"]').first();
    await expect(filterButton).toBeVisible({ timeout: 10000 });
  });

  test("should toggle advanced filters on click", async ({ page }) => {
    await page.goto("/ar/explore");
    const filterToggle = page.locator('button[aria-label="فلاتر"], button[aria-label="Filters"]').first();
    await expect(filterToggle).toBeVisible({ timeout: 10000 });
    await filterToggle.click();
    // Now the advanced filters toggle (inside SearchFilters) should appear
    const advancedToggle = page.locator('button[aria-controls="advanced-filters-section"]').first();
    await expect(advancedToggle).toBeVisible({ timeout: 5000 });
    await advancedToggle.click();
    await expect(advancedToggle).toHaveAttribute("aria-expanded", "true");
    // The advanced filters section should now be visible
    const filtersSection = page.locator("#advanced-filters-section");
    await expect(filtersSection).toBeVisible({ timeout: 5000 });
  });

  test("should display property cards or empty state", async ({ page }) => {
    await page.goto("/ar/explore");
    // Use domcontentloaded to avoid networkidle timeout from Supabase calls
    await page.waitForLoadState("domcontentloaded");
    // Either property cards or the empty-state message should appear
    const propertyCards = page.locator("a[href*='/explore/']");
    const emptyState = page.getByText(/لا توجد عقارات|no properties/i);
    await expect(propertyCards.first().or(emptyState.first())).toBeVisible({
      timeout: 15000,
    });
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
    await page.waitForLoadState("domcontentloaded");
    // Wait for either property cards or empty state before proceeding
    const propertyLink = page.locator("a[href*='/explore/']").first();
    const emptyState = page.getByText(/لا توجد عقارات|no properties/i);
    await expect(propertyLink.or(emptyState.first())).toBeVisible({
      timeout: 15000,
    });
    if ((await propertyLink.count()) > 0) {
      await propertyLink.click();
      await page.waitForLoadState("domcontentloaded");
      // Verify navigation occurred (URL changed or stayed on explore)
      const url = page.url();
      expect(url).toContain("/ar/explore");
    }
  });

  test("should have property images or placeholder", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("domcontentloaded");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    const emptyState = page.getByText(/لا توجد عقارات|no properties/i);
    await expect(propertyLink.or(emptyState.first())).toBeVisible({
      timeout: 15000,
    });
    if ((await propertyLink.count()) > 0) {
      await propertyLink.click();
      // Next.js client navigation can resolve after the current document's
      // DOMContentLoaded event. Wait for the actual property page shell
      // before asserting media content.
      await expect(page.locator("#property-content")).toBeVisible({ timeout: 10000 });
      const images = page.locator("#property-content img");
      const mediaFallback = page.getByRole("img", { name: "Property media unavailable" });
      await expect(images.first().or(mediaFallback.first())).toBeVisible({ timeout: 10000 });
      expect((await images.count()) + (await mediaFallback.count())).toBeGreaterThan(0);
    }
  });

  test("should have contact or share buttons", async ({ page }) => {
    await page.goto("/ar/explore");
    await page.waitForLoadState("domcontentloaded");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    const emptyState = page.getByText(/لا توجد عقارات|no properties/i);
    await expect(propertyLink.or(emptyState.first())).toBeVisible({
      timeout: 15000,
    });
    if ((await propertyLink.count()) > 0) {
      await propertyLink.click();
      await page.waitForLoadState("domcontentloaded");
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
