import { describe, it, expect } from "vitest";
import { sanitize, isValidEmail, isValidPhone } from "@/lib/security/sanitize";

describe("sanitize", () => {
  describe("sanitize", () => {
    it("escapes HTML entities", () => {
      const result = sanitize('<script>alert("xss")</script>');
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("escapes ampersands", () => {
      const result = sanitize("a & b");
      expect(result).toBe("a &amp; b");
    });

    it("escapes quotes", () => {
      const result = sanitize('"hello"');
      expect(result).toContain("&quot;");
    });

    it("escapes single quotes", () => {
      const result = sanitize("it's");
      expect(result).toContain("&#x27;");
    });

    it("escapes forward slashes", () => {
      const result = sanitize("a/b");
      expect(result).toContain("&#x2F;");
    });
  });

  describe("isValidEmail", () => {
    it("allows valid email", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
    });

    it("allows email with subdomain", () => {
      expect(isValidEmail("user@mail.example.com")).toBe(true);
    });

    it("rejects invalid email without @", () => {
      expect(isValidEmail("not-an-email")).toBe(false);
    });

    it("rejects email without domain", () => {
      expect(isValidEmail("user@")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("allows valid Egyptian phone", () => {
      expect(isValidPhone("01234567890")).toBe(true);
    });

    it("allows valid phone with 11 digits", () => {
      expect(isValidPhone("01012345678")).toBe(true);
    });

    it("rejects phone without leading 0", () => {
      expect(isValidPhone("1234567890")).toBe(false);
    });

    it("rejects phone too short", () => {
      expect(isValidPhone("012345678")).toBe(false);
    });

    it("rejects phone with letters", () => {
      expect(isValidPhone("abcdefghij")).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isValidPhone("")).toBe(false);
    });
  });
});
