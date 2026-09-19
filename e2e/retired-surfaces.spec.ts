import { test, expect } from "@playwright/test";

test.describe("Retired runtime surfaces", () => {
  test("legacy office comparison route is fail-closed", async ({ page }) => {
    await page.goto("/ar/investors/compare-offices");
    await expect(page).toHaveURL(/\/ar\/explore(?:\?.*)?$/);
  });

  for (const route of [
    "/ar/dashboard/favorites",
    "/ar/dashboard/saved-searches",
  ]) {
    test(`protected legacy route redirects to login: ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/\/ar\/login(?:\?|$)/);
    });
  }

  test("public navigation does not expose retired notification or favorites controls", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(
      page.locator('button[aria-label*="notification" i], button[aria-label*="إشعار"], button[aria-label*="المفضلة"]'),
    ).toHaveCount(0);
  });
});
