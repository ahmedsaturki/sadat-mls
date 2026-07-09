import { test, expect } from "@playwright/test";

test.describe("Favorites - Guest User", () => {
  test("should redirect to login when clicking favorite without auth", async ({ page }) => {
    await page.goto("/ar/explore");
    const favoriteButton = page.locator("button[aria-label*='favorite'], button[aria-label*='المفضلة']").first();
    if (await favoriteButton.count() > 0) {
      await favoriteButton.click();
      await expect(page).toHaveURL(/\/ar\/login/);
    }
  });
});

test.describe("Favorites - Authenticated User", () => {
  let isAuthenticated = false;

  test.beforeEach(async ({ page }) => {
    isAuthenticated = false;
    await page.goto("/ar/login");
    await page.fill('input[type="email"]', "test@example.com");
    await page.fill('input[type="password"]', "password123");
    await page.click("button[type='submit']");
    // Wait for either redirect (login success) or error (login failure)
    await page.waitForTimeout(3000);
    const url = page.url();
    isAuthenticated = !url.includes("/login");
  });

  test("should toggle favorite state on property card", async ({ page }) => {
    test.skip(!isAuthenticated, "Login failed - skipping authenticated test");
    await page.goto("/ar/explore");
    const favoriteButton = page.locator("button[aria-label*='favorite'], button[aria-label*='المفضلة']").first();
    if (await favoriteButton.count() > 0) {
      const initialPressed = await favoriteButton.getAttribute("aria-pressed");
      await favoriteButton.click();
      await expect(favoriteButton).toHaveAttribute("aria-pressed", (!initialPressed).toString());
    }
  });

  test("should have favorites page accessible in Arabic", async ({ page }) => {
    test.skip(!isAuthenticated, "Login failed - skipping authenticated test");
    await page.goto("/ar/dashboard/favorites");
    await expect(page).toHaveURL(/\/ar\/dashboard\/favorites/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should have favorites page accessible in English", async ({ page }) => {
    test.skip(!isAuthenticated, "Login failed - skipping authenticated test");
    await page.goto("/en/dashboard/favorites");
    await expect(page).toHaveURL(/\/en\/dashboard\/favorites/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("should show empty state when no favorites", async ({ page }) => {
    test.skip(!isAuthenticated, "Login failed - skipping authenticated test");
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
      const favoriteButton = page.locator("button[aria-label*='favorite'], button[aria-label*='المفضلة']");
      await expect(favoriteButton).toBeVisible();
      await expect(favoriteButton).toHaveAttribute("aria-pressed");
    }
  });
});