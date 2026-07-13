import { test as setup, expect } from "@playwright/test";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";

const AUTH_FILE = "playwright/.auth/admin.json";

// Ensure a baseline storageState exists even when admin credentials are
// not configured — Playwright errors if `storageState` points to a missing
// file. When E2E_ADMIN_EMAIL isn't set, we write an empty-state JSON so the
// admin-chromium project can still run (its tests will redirect to login,
// surfacing the missing-seed-credentials issue transparently).
function ensureEmptyAuth(): void {
  if (!existsSync(AUTH_FILE)) {
    mkdirSync(dirname(AUTH_FILE), { recursive: true });
    writeFileSync(
      AUTH_FILE,
      JSON.stringify({ cookies: [], origins: [] }),
      "utf8"
    );
  }
}

setup("authenticate as super_admin", async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    ensureEmptyAuth();
    setup.skip(true, "E2E_ADMIN_EMAIL/PASSWORD not set — skipping admin auth setup");
    return;
  }

  await page.goto("/ar/login");
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  // Remove disabled attribute in case client-side rate limiter is active
  await page.locator('button[type="submit"]').evaluate(btn => btn.removeAttribute("disabled"));
  await page.locator('button[type="submit"]').click();

  // Wait for redirect to dashboard or admin (post-login).
  await expect(page).toHaveURL(/\/(dashboard|admin)/, { timeout: 15000 });

  // Persist auth cookies + localStorage for downstream admin tests.
  await page.context().storageState({ path: AUTH_FILE });
});

