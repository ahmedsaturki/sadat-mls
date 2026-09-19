import { test, expect } from "@playwright/test";

test.describe("Favorites - current contract", () => {
  test("protected favorites route redirects an unauthenticated visitor to login", async ({ page }) => {
    await page.goto("/ar/dashboard/favorites");
    await expect(page).toHaveURL(/\/ar\/login(?:\?|$)/);
  });

  test("public explore does not expose an unsupported favorite control", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(
      page.locator('button[aria-label*="favorite" i], button[aria-label*="المفضلة"]'),
    ).toHaveCount(0);
  });

  test("public property detail does not expose an unsupported favorite control", async ({ page }) => {
    await page.goto("/ar/explore");
    const propertyLink = page.locator("a[href*='/explore/']").first();
    const emptyState = page.getByText(/لا توجد عقارات نشطة مطابقة|no active properties match/i);
    await expect(propertyLink.or(emptyState)).toBeVisible({ timeout: 15000 });

    if (await propertyLink.count() > 0) {
      await propertyLink.click();
      await expect(page.locator("#property-content")).toBeVisible({ timeout: 10000 });
      await expect(
        page.locator('button[aria-label*="favorite" i], button[aria-label*="المفضلة"]'),
      ).toHaveCount(0);
    }
  });
});
