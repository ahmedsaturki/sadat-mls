import { describe, it, expect } from "vitest";
import { isValidLocale, RTL_LOCALES } from "@/i18n/config";

describe("i18n config", () => {
  describe("isValidLocale", () => {
    it("accepts Arabic", () => {
      expect(isValidLocale("ar")).toBe(true);
    });

    it("accepts English", () => {
      expect(isValidLocale("en")).toBe(true);
    });

    it("rejects invalid locale", () => {
      expect(isValidLocale("fr")).toBe(false);
      expect(isValidLocale("de")).toBe(false);
      expect(isValidLocale("")).toBe(false);
    });

    it("rejects uppercase variant of valid locale", () => {
      expect(isValidLocale("AR")).toBe(false);
      expect(isValidLocale("EN")).toBe(false);
    });

    it("rejects null and undefined", () => {
      expect(isValidLocale(null as unknown as string)).toBe(false);
      expect(isValidLocale(undefined as unknown as string)).toBe(false);
    });

    it("rejects numeric input", () => {
      expect(isValidLocale("123" as unknown as string)).toBe(false);
    });
  });

  describe("RTL_LOCALES", () => {
    it("contains Arabic", () => {
      expect(RTL_LOCALES).toContain("ar");
    });

    it("does not contain English", () => {
      expect(RTL_LOCALES).not.toContain("en");
    });

    it("is an array", () => {
      expect(Array.isArray(RTL_LOCALES)).toBe(true);
    });

    it("has at least one entry", () => {
      expect(RTL_LOCALES.length).toBeGreaterThanOrEqual(1);
    });

    it("only contains two-letter locale codes", () => {
      for (const locale of RTL_LOCALES) {
        expect(locale.length).toBe(2);
      }
    });
  });
});
