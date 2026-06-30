import { test, expect } from "@playwright/test";

test.describe("Favorites - Guest User", () => {
  test("should redirect to login when clicking favorite without auth", async ({ page }) => {
    await page.goto("/ar/explore");
    const favoriteButton = page.locator("button[aria-label*='favorite']").first();
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await expect(page).toHaveURL(/\/ar\/login/);
    }
  });
});

test.describe("Favorites - Authenticated User", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ar/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("button[type='submit']");
    await page.waitForURL(/\/ar\/dashboard|ar\/explore/, { timeout: 10000 });
  });

  test("should toggle favorite state on property card", async ({ page }) => {
    await page.goto("/ar/explore");
    const favoriteButton = page.locator("button[aria-label*='favorite']").first();
    if (await favoriteButton.count() > 0) {
      const initialPressed = await favoriteButton.getAttribute("aria-pressed");
      await favoriteButton.click();
      await expect(favoriteButton).toHaveAttribute("aria-pressed", (!initialPressed).toString());
    }
  });

  test("should have favorites page accessible in Arabic", async ({ page }) => {
    await page.goto("/ar/dashboard/favorites");
    await expect(page).toHaveURL(/\/ar\/dashboard\/favorites/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should have favorites page accessible in English", async ({ page }) => {
    await page.goto("/en/dashboard/favorites");
    await expect(page).toHaveURL(/\/en\/dashboard\/favorites/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("should show empty state when no favorites", async ({ page }) => {
    await page.goto("/ar/dashboard/favorites");
    const emptyState = page.locator("text=/.*no.*favorite.*|.*empty.*|.*لا توجد.*/");
    await expect(emptyState).toBeVisible({ timeout: 5000 });
  });
});

test.describe("Favorites - Property Detail Page", () => {
  test("should render favorite button on property detail page", async ({ page }) => {
    await page.goto("/ar/explore");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const favoriteButton = page.locator("button[aria-label*='favorite']");
      await expect(favoriteButton).toBeVisible();
      await expect(favoriteButton).toHaveAttribute("aria-pressed");
    }
  });
});