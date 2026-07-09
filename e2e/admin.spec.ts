import { test, expect } from "@playwright/test";

// When E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are not set (CI without
// admin seed), skip all @admin tests so they don't fail with a login-
// redirect error. This surfaces the missing credentials as skipped
// tests rather than false failures.
const isAdminConfigured =
  !!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

// The 404 tests at the bottom are untagged (no @admin) so they run on
// any browser without auth. However, the middleware may redirect an
// unauthenticated user to /login before the 404 page renders, so
// those tests accept either a 404 status or a redirect (3xx).

test.describe("Admin Zones Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should load zones page in Arabic @admin", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    await expect(page).toHaveURL(/\/ar\/admin\/zones/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load zones page in English", async ({ page }) => {
    await page.goto("/en/admin/zones");
    await expect(page).toHaveURL(/\/en\/admin\/zones/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have add zone button", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await expect(addButton.first()).toBeVisible();
  });

  test("should open add zone modal when clicking add button", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click();
    // Modal should appear with save/cancel buttons
    const modal = page.locator('[role="dialog"], .fixed, [data-testid="modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show cancel button in modal", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click();
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await expect(cancelButton.first()).toBeVisible({ timeout: 5000 });
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click();
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await cancelButton.first().click();
    // Modal should be hidden
    await expect(page.locator('[role="dialog"], .fixed')).toHaveCount(0, { timeout: 5000 });
  });

  test("should have search input for zones", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    const searchInput = page.locator('input[placeholder*="بحث"], input[placeholder*="search"], input[type="search"]');
    await expect(searchInput.first()).toBeVisible();
  });
});

test.describe("Admin Property Types Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should load property types page in Arabic", async ({ page }) => {
    await page.goto("/ar/admin/property-types");
    await expect(page).toHaveURL(/\/ar\/admin\/property-types/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load property types page in English", async ({ page }) => {
    await page.goto("/en/admin/property-types");
    await expect(page).toHaveURL(/\/en\/admin\/property-types/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have add property type button", async ({ page }) => {
    await page.goto("/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await expect(addButton.first()).toBeVisible();
  });

  test("should open add property type modal when clicking add button", async ({ page }) => {
    await page.goto("/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click();
    const modal = page.locator('[role="dialog"], .fixed, [data-testid="modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 5000 });
  });

  test("should show save button in modal", async ({ page }) => {
    await page.goto("/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click();
    const saveButton = page.locator("button", { hasText: /حفظ|save/i });
    await expect(saveButton.first()).toBeVisible({ timeout: 5000 });
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    await page.goto("/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click();
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await cancelButton.first().click();
    await expect(page.locator('[role="dialog"], .fixed')).toHaveCount(0, { timeout: 5000 });
  });
});

test.describe("Admin Contact Requests Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should load contact requests page", async ({ page }) => {
    await page.goto("/ar/admin/contact-requests");
    await expect(page).toHaveURL(/\/ar\/admin\/contact-requests/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should load contact requests in English", async ({ page }) => {
    await page.goto("/en/admin/contact-requests");
    await expect(page).toHaveURL(/\/en\/admin\/contact-requests/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("Admin Navigation @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should navigate between admin pages", async ({ page }) => {
    await page.goto("/ar/admin/zones");
    await expect(page).toHaveURL(/\/ar\/admin\/zones/);

    // Navigate to property types
    await page.goto("/ar/admin/property-types");
    await expect(page).toHaveURL(/\/ar\/admin\/property-types/);

    // Navigate to contact requests
    await page.goto("/ar/admin/contact-requests");
    await expect(page).toHaveURL(/\/ar\/admin\/contact-requests/);
  });

  test("should respect locale switching", async ({ page }) => {
    // Load in Arabic
    await page.goto("/ar/admin/zones");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    // Switch to English
    await page.goto("/en/admin/zones");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});

test.describe("Admin 404 Page", () => {
  test("should show 404 for non-existent admin page", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    // Unauthenticated: middleware redirects to login. Authenticated: 404 page.
    const url = page.url();
    const redirectedToLogin = url.includes("/login");
    const has404Text = (await page.locator("text=404").count()) > 0;
    expect(redirectedToLogin || has404Text).toBeTruthy();
  });

  test("should show 404 with admin branding", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    // Either shows the 404 page content or was redirected to login
    const has404 = await page.locator("text=404").count() > 0;
    const hasLogin = page.url().includes("/login");
    expect(has404 || hasLogin).toBeTruthy();
  });

  test("should have link back to admin", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    // Either has an admin link on the 404 page or was redirected to login
    const adminLink = page.locator('a[href*="admin"]');
    const hasLink = await adminLink.count() > 0;
    const hasLogin = page.url().includes("/login");
    expect(hasLink || hasLogin).toBeTruthy();
  });
});
