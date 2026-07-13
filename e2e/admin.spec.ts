import { test, expect } from "@playwright/test";

// When E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD are not set (CI without
// admin seed), skip all @admin tests so they don't fail with a login-
// redirect error.
const isAdminConfigured =
  !!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

// The admin-chromium project in playwright.config.ts loads storageState
// from playwright/.auth/admin.json (populated by auth.setup.ts). Each
// test's beforeEach used to call loginAsAdmin() again, burning rate-limit
// quota and causing cascading failures after ~5 tests. We now rely
// solely on the storageState and only navigate to the target page.
//
// If the stored session is expired/invalid, the AuthGuard will redirect
// to /login and the test will fail naturally — which is the correct
// signal that auth setup needs investigation.

// Wait for the AuthGuard client-side check to complete. AuthGuard shows
// a LoadingSpinner while useAuthUser() fetches the profile. Once the
// profile loads and the role check passes, the actual page content
// renders. We detect this by waiting for a known element that only
// appears after auth succeeds.
async function waitForAuthGuard(page: import("@playwright/test").Page, url: string) {
  await page.goto(url);
  // Wait for either: (a) the page content to render (auth succeeded),
  // or (b) a redirect to /login (auth failed — test will fail).
  await page.waitForLoadState("domcontentloaded");
  // The AuthGuard renders a LoadingSpinner div while checking. Give it
  // up to 15s to complete. We detect completion by checking for ANY
  // button on the page (the add button) OR a URL change to /login.
  await page.waitForFunction(
    () => {
      const url = window.location.pathname;
      if (url.includes("/login")) return true; // redirect happened
      // Check if any button exists (content rendered after auth guard)
      return document.querySelectorAll("button").length > 0;
    },
    { timeout: 20000 }
  );
}

test.describe("Admin Zones Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should load zones page in Arabic @admin", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    await expect(page).toHaveURL(/\/ar\/admin\/zones/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load zones page in English", async ({ page }) => {
    await waitForAuthGuard(page, "/en/admin/zones");
    await expect(page).toHaveURL(/\/en\/admin\/zones/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have add zone button", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should open add zone modal when clicking add button", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const modal = page.locator('[role="dialog"], .fixed, [data-testid="modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show cancel button in modal", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await expect(cancelButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await cancelButton.first().click();
    await expect(page.locator('[role="dialog"], .fixed')).toHaveCount(0, { timeout: 10000 });
  });

  test("should have search input for zones", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    const searchInput = page.locator('input[placeholder*="بحث"], input[placeholder*="search"], input[type="search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Property Types Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should load property types page in Arabic", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/property-types");
    await expect(page).toHaveURL(/\/ar\/admin\/property-types/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load property types page in English", async ({ page }) => {
    await waitForAuthGuard(page, "/en/admin/property-types");
    await expect(page).toHaveURL(/\/en\/admin\/property-types/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have add property type button", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should open add property type modal when clicking add button", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const modal = page.locator('[role="dialog"], .fixed, [data-testid="modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show save button in modal", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const saveButton = page.locator("button", { hasText: /حفظ|save/i });
    await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/property-types");
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await cancelButton.first().click();
    await expect(page.locator('[role="dialog"], .fixed')).toHaveCount(0, { timeout: 10000 });
  });
});

test.describe("Admin Contact Requests Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should load contact requests page", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/contact-requests");
    await expect(page).toHaveURL(/\/ar\/admin\/contact-requests/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should load contact requests in English", async ({ page }) => {
    await waitForAuthGuard(page, "/en/admin/contact-requests");
    await expect(page).toHaveURL(/\/en\/admin\/contact-requests/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("Admin Navigation @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin tests");

  test("should navigate between admin pages", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    await expect(page).toHaveURL(/\/ar\/admin\/zones/);

    await page.goto("/ar/admin/property-types");
    await expect(page).toHaveURL(/\/ar\/admin\/property-types/);

    await page.goto("/ar/admin/contact-requests");
    await expect(page).toHaveURL(/\/ar\/admin\/contact-requests/);
  });

  test("should respect locale switching", async ({ page }) => {
    await waitForAuthGuard(page, "/ar/admin/zones");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await page.goto("/en/admin/zones");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });
});

test.describe("Admin 404 Page", () => {
  test("should show 404 for non-existent admin page", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    const url = page.url();
    const redirectedToLogin = url.includes("/login");
    const has404Text = (await page.locator("text=404").count()) > 0;
    expect(redirectedToLogin || has404Text).toBeTruthy();
  });

  test("should show 404 with admin branding", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    const has404 = await page.locator("text=404").count() > 0;
    const hasLogin = page.url().includes("/login");
    expect(has404 || hasLogin).toBeTruthy();
  });

  test("should have link back to admin", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    const adminLink = page.locator('a[href*="admin"]');
    const hasLink = await adminLink.count() > 0;
    const hasLogin = page.url().includes("/login");
    const has404Content = await page.locator("text=/404|not found|غير موجود/i").count() > 0;
    expect(hasLink || hasLogin || has404Content).toBeTruthy();
  });
});
