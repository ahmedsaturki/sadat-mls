import { describe, it, expect } from "vitest";
import { getPasswordRuleErrors, getFirstPasswordError, DEFAULT_PASSWORD_RULES } from "@/lib/security/password-rules";

describe("password-rules", () => {
  describe("getPasswordRuleErrors", () => {
    it("returns empty array for valid strong password", () => {
      const errors = getPasswordRuleErrors("MyStr0ng!Pass");
      expect(errors).toEqual([]);
    });

    it("returns required error for empty input", () => {
      const errors = getPasswordRuleErrors("");
      expect(errors).toEqual(["Password is required"]);
    });

    it("returns required error for non-string input", () => {
      // @ts-expect-error - intentionally bad input
      const errors = getPasswordRuleErrors(null);
      expect(errors).toEqual(["Password is required"]);
    });

    it("detects too-short passwords", () => {
      const errors = getPasswordRuleErrors("Ab1@");
      expect(errors).toContain("Password must be at least 8 characters long");
    });

    it("detects too-long passwords", () => {
      const long = "Aa1!" + "x".repeat(200);
      const errors = getPasswordRuleErrors(long);
      expect(errors).toContain("Password cannot exceed 128 characters");
    });

    it("detects missing uppercase", () => {
      const errors = getPasswordRuleErrors("mystr0ng!pass");
      expect(errors).toContain("Password must contain at least one uppercase letter");
    });

    it("detects missing lowercase", () => {
      const errors = getPasswordRuleErrors("MYSTR0NG!PASS");
      expect(errors).toContain("Password must contain at least one lowercase letter");
    });

    it("detects missing number", () => {
      const errors = getPasswordRuleErrors("MyStrong!Pass");
      expect(errors).toContain("Password must contain at least one number");
    });

    it("detects missing special character", () => {
      const errors = getPasswordRuleErrors("MyStr0ngPass");
      expect(errors).toContain("Password must contain at least one special character");
    });

    it("detects blocked common passwords", () => {
      const errors = getPasswordRuleErrors("Password1!");
      expect(errors).toContain("Password is too common");
    });

    it("collects multiple errors at once", () => {
      const errors = getPasswordRuleErrors("abc");
      expect(errors.length).toBeGreaterThan(1);
    });

    it("accepts custom config blocklist", () => {
      const custom = { ...DEFAULT_PASSWORD_RULES, blockedPasswords: ["Forbidden1!"] };
      const errors = getPasswordRuleErrors("Forbidden1!", custom);
      expect(errors).toContain("Password is too common");
    });
  });

  describe("getFirstPasswordError", () => {
    it("returns null for valid password", () => {
      expect(getFirstPasswordError("MyStr0ng!Pass")).toBeNull();
    });

    it("returns first error message for invalid password", () => {
      expect(getFirstPasswordError("abc")).toBe("Password must be at least 8 characters long");
    });

    it("returns required message for empty", () => {
      expect(getFirstPasswordError("")).toBe("Password is required");
    });
  });
});
