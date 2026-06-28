import { test, expect } from "@playwright/test";

test.describe("Forgot Password Page", () => {
  test("should load forgot password page in Arabic", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    await expect(page).toHaveURL(/\/ar\/forgot-password/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load forgot password page in English", async ({ page }) => {
    await page.goto("/en/forgot-password");
    await expect(page).toHaveURL(/\/en\/forgot-password/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have email input field", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test("should have submit button", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test("should show success message after submitting valid email", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('button[type="submit"]').click();
    // Should show a success/confirmation message (not an error)
    await expect(page.locator("text=تم إرسال")).toBeVisible({ timeout: 5000 });
  });

  test("should have link back to login", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    const loginLink = page.locator('a[href*="login"]');
    await expect(loginLink).toBeVisible();
  });
});

test.describe("Reset Password Page", () => {
  test("should load reset password page in Arabic", async ({ page }) => {
    await page.goto("/ar/reset-password");
    await expect(page).toHaveURL(/\/ar\/reset-password/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load reset password page in English", async ({ page }) => {
    await page.goto("/en/reset-password");
    await expect(page).toHaveURL(/\/en\/reset-password/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should have password and confirm password fields", async ({ page }) => {
    await page.goto("/ar/reset-password");
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs).toHaveCount(2);
  });

  test("should have submit button", async ({ page }) => {
    await page.goto("/ar/reset-password");
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });
});

test.describe("Verify Email Page", () => {
  test("should load verify email page in Arabic", async ({ page }) => {
    await page.goto("/ar/verify-email");
    await expect(page).toHaveURL(/\/ar\/verify-email/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("should load verify email page in English", async ({ page }) => {
    await page.goto("/en/verify-email");
    await expect(page).toHaveURL(/\/en\/verify-email/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("should display verification status or resend option", async ({ page }) => {
    await page.goto("/ar/verify-email");
    // Should show some content about email verification
    const content = page.locator("body");
    await expect(content).toContainText(/تحقق|بريد|إعادة|email|verify|resend/i);
  });
});

test.describe("Auth Flow Navigation", () => {
  test("should navigate from login to forgot password", async ({ page }) => {
    await page.goto("/ar/login");
    const forgotLink = page.locator('a[href*="forgot-password"]');
    await expect(forgotLink).toBeVisible();
    await forgotLink.click();
    await expect(page).toHaveURL(/\/ar\/forgot-password/);
  });

  test("should navigate from forgot password back to login", async ({ page }) => {
    await page.goto("/ar/forgot-password");
    const loginLink = page.locator('a[href*="login"]').first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/ar\/login/);
  });
});
