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
  });

  describe("RTL_LOCALES", () => {
    it("contains Arabic", () => {
      expect(RTL_LOCALES).toContain("ar");
    });

    it("does not contain English", () => {
      expect(RTL_LOCALES).not.toContain("en");
    });
  });
});
