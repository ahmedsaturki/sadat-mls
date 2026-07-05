import { describe, it, expect } from "vitest";
import { formatPrice } from "@/lib/utils/cn";

describe("formatPrice", () => {
  it("formats price in Arabic with Arabic numerals", () => {
    const result = formatPrice(1500000, "ar");
    expect(result).toContain("١");
    expect(result).toContain("٥");
    expect(result).toContain("٠");
  });

  it("formats price in English with Western numerals", () => {
    const result = formatPrice(1500000, "en");
    expect(result).toContain("1");
    expect(result).toContain("5");
    expect(result).toContain("0");
  });

  it("formats large numbers with thousand separators", () => {
    const result = formatPrice(1000000, "en");
    expect(result).toContain(",");
  });

  it("handles zero price", () => {
    const result = formatPrice(0, "en");
    expect(result).toBeTruthy();
  });

  it("handles negative price", () => {
    const result = formatPrice(-5000, "en");
    expect(result).toContain("-");
  });

  it("defaults to Arabic locale", () => {
    const result = formatPrice(1000);
    expect(result).toContain("١");
  });

  // --- New edge-case tests ---

  it("handles NaN input without throwing", () => {
    // Intl.NumberFormat.format(NaN) returns "NaN" in the locale
    const result = formatPrice(NaN, "en");
    expect(result).toBe("NaN");
  });

  it("handles Infinity input without throwing", () => {
    // Intl.NumberFormat.format(Infinity) returns "∞" in some locales or "inf"
    const resultEn = formatPrice(Infinity, "en");
    expect(resultEn).toBeTruthy();
    // Should be a string representation of infinity
    expect(typeof resultEn).toBe("string");

    const resultAr = formatPrice(Infinity, "ar");
    expect(resultAr).toBeTruthy();
    expect(typeof resultAr).toBe("string");
  });

  it("formats very large numbers (billions) with thousand separators", () => {
    const result = formatPrice(1_500_000_000, "en");
    // Expect "1,500,000,000"
    expect(result).toBe("1,500,000,000");
  });

  it("truncates decimal fractions (maximumFractionDigits: 0)", () => {
    // The implementation uses maximumFractionDigits: 0
    const result = formatPrice(999.99, "en");
    // Should round to nearest integer: 1000
    expect(result).toBe("1,000");
  });

  it("truncates fractional input like 1500.75", () => {
    const result = formatPrice(1500.75, "en");
    // Should round to 1501
    expect(result).toBe("1,501");
  });

  it("defaults to Arabic locale when locale is empty string", () => {
    // Empty string is not "en", so it should fall through to ar-EG
    const result = formatPrice(1000, "");
    // ar-EG uses Arabic-Indic numerals
    expect(result).toContain("١");
  });

  it("maps Arabic numerals correctly for locale 'ar'", () => {
    // Arabic-Indic digit mapping: 0→٠, 1→١, 2→٢, 3→٣, 4→٤, 5→٥, 6→٦, 7→٧, 8→٨, 9→٩
    const result = formatPrice(1234567890, "ar");
    expect(result).toContain("١");
    expect(result).toContain("٢");
    expect(result).toContain("٣");
    expect(result).toContain("٤");
    expect(result).toContain("٥");
    expect(result).toContain("٦");
    expect(result).toContain("٧");
    expect(result).toContain("٨");
    expect(result).toContain("٩");
    expect(result).toContain("٠");
  });

  it("maps Western numerals correctly for locale 'en'", () => {
    const result = formatPrice(1234567890, "en");
    expect(result).toBe("1,234,567,890");
  });

  it("formats small positive number without separator", () => {
    const result = formatPrice(42, "en");
    expect(result).toBe("42");
  });

  it("formats number 1 correctly in both locales", () => {
    expect(formatPrice(1, "en")).toBe("1");
    expect(formatPrice(1, "ar")).toContain("١");
  });
});
