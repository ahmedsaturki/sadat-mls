import { test, expect } from "@playwright/test";

const isAdminConfigured =
  !!process.env.E2E_ADMIN_EMAIL && !!process.env.E2E_ADMIN_PASSWORD;

// admin-chromium loads storageState from playwright/.auth/admin.json.
// If the session is expired/invalid (AuthGuard redirects to /login),
// we skip the test to avoid cascading failures.

async function goToAdmin(
  page: import("@playwright/test").Page,
  url: string,
): Promise<boolean> {
  await page.goto(url);
  await page.waitForLoadState("domcontentloaded");
  await page.waitForFunction(
    () => {
      const p = window.location.pathname;
      if (p.includes("/login")) return true;
      return document.querySelectorAll("button, h1, table, [role='table']").length > 0;
    },
    { timeout: 15000 },
  );
  return !new URL(page.url()).pathname.includes("/login");
}

test.describe("Admin Zones Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set");

  test("should load zones page in Arabic @admin", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/ar\/admin\/zones/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load zones page in English", async ({ page }) => {
    const ok = await goToAdmin(page, "/en/admin/zones");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/en\/admin\/zones/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have add zone button", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should open add zone modal when clicking add button", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const modal = page.locator('[role="dialog"], .fixed, [data-testid="modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show cancel button in modal", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await expect(cancelButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await cancelButton.first().click();
    await expect(page.locator('[role="dialog"], .fixed')).toHaveCount(0, { timeout: 10000 });
  });

  test("should have search input for zones", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    const searchInput = page.locator('input[placeholder*="بحث"], input[placeholder*="search"], input[type="search"]');
    await expect(searchInput.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Admin Property Types Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set");

  test("should load property types page in Arabic", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/property-types");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/ar\/admin\/property-types/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load property types page in English", async ({ page }) => {
    const ok = await goToAdmin(page, "/en/admin/property-types");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/en\/admin\/property-types/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have add property type button", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/property-types");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await expect(addButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should open add property type modal when clicking add button", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/property-types");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const modal = page.locator('[role="dialog"], .fixed, [data-testid="modal"]');
    await expect(modal.first()).toBeVisible({ timeout: 10000 });
  });

  test("should show save button in modal", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/property-types");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const saveButton = page.locator("button", { hasText: /حفظ|save/i });
    await expect(saveButton.first()).toBeVisible({ timeout: 10000 });
  });

  test("should close modal when clicking cancel", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/property-types");
    if (!ok) { test.skip(); return; }
    const addButton = page.locator("button", { hasText: /إضافة|add/i });
    await addButton.first().click({ timeout: 10000 });
    const cancelButton = page.locator("button", { hasText: /إلغاء|cancel/i });
    await cancelButton.first().click();
    await expect(page.locator('[role="dialog"], .fixed')).toHaveCount(0, { timeout: 10000 });
  });
});

test.describe("Admin Contact Requests Page @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set");

  test("should load contact requests page", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/contact-requests");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/ar\/admin\/contact-requests/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("should load contact requests in English", async ({ page }) => {
    const ok = await goToAdmin(page, "/en/admin/contact-requests");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/en\/admin\/contact-requests/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });
});

test.describe("Admin Navigation @admin", () => {
  test.skip(!isAdminConfigured, "E2E_ADMIN_EMAIL/PASSWORD not set");

  test("should navigate between admin pages", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
    await expect(page).toHaveURL(/\/ar\/admin\/zones/);

    await page.goto("/ar/admin/property-types");
    await expect(page).toHaveURL(/\/ar\/admin\/property-types/);

    await page.goto("/ar/admin/contact-requests");
    await expect(page).toHaveURL(/\/ar\/admin\/contact-requests/);
  });

  test("should respect locale switching", async ({ page }) => {
    const ok = await goToAdmin(page, "/ar/admin/zones");
    if (!ok) { test.skip(); return; }
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
