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
});
