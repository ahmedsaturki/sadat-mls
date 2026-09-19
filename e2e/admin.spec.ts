import { test, expect } from "@playwright/test";

const adminRoutes = [
  "/ar/admin",
  "/ar/admin/zones",
  "/ar/admin/property-types",
  "/ar/admin/offices",
  "/ar/admin/users",
  "/ar/admin/developers",
  "/ar/admin/projects",
  "/ar/admin/office-registrations",
];

test.describe("Admin - current contract", () => {
  for (const route of adminRoutes) {
    test(`does not expose legacy admin surface: ${route}`, async ({ page }) => {
      await page.goto(route);
      const pathname = new URL(page.url()).pathname;
      expect(pathname === "/ar/login" || pathname === "/ar/explore").toBeTruthy();
    });
  }

  test("English admin root is protected", async ({ page }) => {
    await page.goto("/en/admin");
    const pathname = new URL(page.url()).pathname;
    expect(pathname === "/en/login" || pathname === "/en/explore").toBeTruthy();
  });

  test("legacy CRUD affordances are not exposed on protected admin routes", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    const pathname = new URL(page.url()).pathname;
    if (pathname === "/ar/login" || pathname === "/ar/explore") return;

    await expect(page.getByRole("button", { name: /إضافة|add/i })).toHaveCount(0);
    await expect(page.locator('input[type="search"]')).toHaveCount(0);
  });
});
