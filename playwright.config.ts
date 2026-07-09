import { defineConfig, devices } from "@playwright/test";

const port = process.env.PORT || 3000;
const baseURL = process.env.BASE_URL || `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30000,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Admin auth setup — runs first if E2E_ADMIN_EMAIL is set,
    // otherwise skips. Downstream admin-chromium project consumes
    // its playwright/.auth/admin.json storageState.
    {
      name: "admin-auth-setup",
      testMatch: /auth\.setup\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      // Admin tests are tag-filtered out of the default project; they run
      // only in the admin-chromium project below which has storageState.
      grepInvert: /@admin/,
    },
    {
      name: "admin-chromium",
      testMatch: /admin\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
      dependencies: ["admin-auth-setup"],
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: process.env.CI ? 30000 : 120000,
  },
});
