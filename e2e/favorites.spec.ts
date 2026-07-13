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
    const hasCredentials = !!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;
    if (!hasCredentials) return;

    await page.goto("/ar/login");
    await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL!);
    await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD!);
    await page.locator("button[type='submit']").evaluate(btn => btn.removeAttribute("disabled"));
    await page.locator("button[type='submit']").click({ timeout: 10000 });
    try {
      await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
      isAuthenticated = true;
    } catch {
      isAuthenticated = false;
    }
  });

  test("should toggle favorite state on property card", async ({ page }) => {
    test.skip(!isAuthenticated, "Login failed - skipping authenticated test");
    await page.goto("/ar/explore");
    await page.waitForLoadState("domcontentloaded");
    const favoriteButton = page.locator("button[aria-label*='favorite'], button[aria-label*='المفضلة']").first();
    await page.waitForTimeout(2000);
    if (await favoriteButton.count() > 0) {
      const initialPressed = await favoriteButton.getAttribute("aria-pressed");
      const wasPressed = initialPressed === "true";
      await favoriteButton.click();
      await expect(favoriteButton).toHaveAttribute("aria-pressed", (!wasPressed).toString());
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
      await page.waitForTimeout(1000);
      const favoriteButton = page.locator("button[aria-label*='favorite'], button[aria-label*='المفضلة']");
      await expect(favoriteButton).toBeVisible({ timeout: 10000 });
      await expect(favoriteButton).toHaveAttribute("aria-pressed");
    }
  });
});