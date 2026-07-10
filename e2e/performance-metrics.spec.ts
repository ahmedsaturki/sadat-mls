import { test, expect } from "@playwright/test";

async function collectMetrics(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const results: Record<string, number> = {};

    // Get LCP from buffered entries
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as any[];
    results.lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1].startTime : 0;

    // Get FCP from paint entries
    const paintEntries = performance.getEntriesByType("paint") as any[];
    const fcpEntry = paintEntries.find((e: any) => e.name === "first-contentful-paint");
    results.fcp = fcpEntry ? fcpEntry.startTime : 0;

    // Get navigation timing
    const nav = performance.getEntriesByType("navigation")[0] as any;
    if (nav) {
      results.ttfb = nav.responseStart - nav.requestStart;
      results.domContentLoaded = nav.domContentLoadedEventEnd - nav.startTime;
    }

    // Resource summary
    const resources = performance.getEntriesByType("resource");
    results.totalTransferKB = Math.round(
      resources.reduce((s: number, r: any) => s + (r.transferSize || 0), 0) / 1024,
    );
    results.resourceCount = resources.length;

    return results;
  });
}

function logMetrics(name: string, loadTime: number, m: Record<string, number>) {
  console.log(`\n=== ${name} ===`);
  console.log(`  Load: ${loadTime}ms | TTFB: ${Math.round(m.ttfb || 0)}ms | FCP: ${Math.round(m.fcp || 0)}ms`);
  console.log(`  LCP: ${Math.round(m.lcp || 0)}ms | Transfer: ${m.totalTransferKB || 0} KB (${m.resourceCount || 0} resources)`);
}

test.describe("Performance Metrics", () => {
  test("should collect Core Web Vitals on homepage", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/ar", { waitUntil: "networkidle" });
    const loadTime = Date.now() - startTime;
    const m = await collectMetrics(page);
    logMetrics("Homepage (Arabic)", loadTime, m);

    expect(loadTime).toBeLessThan(10000);
    expect(m.lcp || 0).toBeLessThan(5000);
  });

  test("should collect metrics on explore page", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/ar/explore", { waitUntil: "networkidle" });
    const loadTime = Date.now() - startTime;
    const m = await collectMetrics(page);
    logMetrics("Explore", loadTime, m);

    expect(loadTime).toBeLessThan(15000);
    expect(m.lcp || 0).toBeLessThan(7000);
  });

  test("should collect metrics on property detail page", async ({ page }) => {
    await page.goto("/ar/explore", { waitUntil: "networkidle" });
    const propertyLink = page.locator("a[href*='/explore/']").first();

    if ((await propertyLink.count()) > 0) {
      const startTime = Date.now();
      await propertyLink.click();
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - startTime;
      const m = await collectMetrics(page);
      logMetrics("Property Detail", loadTime, m);

      expect(loadTime).toBeLessThan(15000);
    }
  });
});
