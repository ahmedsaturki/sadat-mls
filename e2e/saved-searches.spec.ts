import { test, expect } from "@playwright/test";

test.describe("Saved Searches - current contract", () => {
  test("protected saved-searches route redirects an unauthenticated visitor to login", async ({ page }) => {
    await page.goto("/ar/dashboard/saved-searches");
    await expect(page).toHaveURL(/\/ar\/login(?:\?|$)/);
  });

  test("public explore does not expose an unsupported save-search control", async ({ page }) => {
    await page.goto("/ar/explore");
    await expect(page).toHaveURL(/\/ar\/explore(?:\?.*)?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("button", { name: /save search|حفظ البحث/i })).toHaveCount(0);
  });

  test("English protected route also redirects to login", async ({ page }) => {
    await page.goto("/en/dashboard/saved-searches");
    await expect(page).toHaveURL(/\/en\/login(?:\?|$)/);
  });
});
