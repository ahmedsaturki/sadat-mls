import { test, expect } from "@playwright/test";

test.describe("Admin Zones Page", () => {
  test("should load zones page in Arabic", async ({ page }) => {
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

test.describe("Admin Property Types Page", () => {
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

test.describe("Admin Contact Requests Page", () => {
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

test.describe("Admin Navigation", () => {
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
    const response = await page.goto("/ar/admin/nonexistent-page");
    expect(response?.status()).toBe(404);
  });

  test("should show 404 with admin branding", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    await expect(page.locator("text=404")).toBeVisible();
  });

  test("should have link back to admin", async ({ page }) => {
    await page.goto("/ar/admin/nonexistent-page");
    const adminLink = page.locator('a[href="/admin"]');
    await expect(adminLink).toBeVisible();
  });
});
