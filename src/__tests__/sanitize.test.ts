import { describe, it, expect } from "vitest";
import { sanitize, sanitizeObject, truncate, isValidEmail, isValidPhone } from "@/lib/security/sanitize";

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

  describe("sanitizeObject", () => {
    it("sanitizes string values in objects", () => {
      const result = sanitizeObject({ name: '<script>alert("xss")</script>' });
      expect(result.name).not.toContain("<script>");
      expect(result.name).toContain("&lt;script&gt;");
    });

    it("sanitizes nested objects", () => {
      const result = sanitizeObject({ outer: { inner: '<img onerror="alert(1)">' } });
      expect(result.outer.inner).not.toContain("<img");
      expect(result.outer.inner).toContain("&lt;img");
    });

    it("sanitizes arrays of strings", () => {
      const result = sanitizeObject(["<b>bold</b>", "normal"]);
      expect(result[0]).not.toContain("<b>");
      expect(result[0]).toContain("&lt;b&gt;");
      expect(result[1]).toBe("normal");
    });

    it("passes through non-string primitives", () => {
      const result = sanitizeObject({ count: 42, active: true, empty: null });
      expect(result.count).toBe(42);
      expect(result.active).toBe(true);
      expect(result.empty).toBe(null);
    });

    it("passes through null", () => {
      expect(sanitizeObject(null)).toBe(null);
    });

    it("passes through undefined", () => {
      expect(sanitizeObject(undefined)).toBe(undefined);
    });

    it("sanitizes deeply nested objects", () => {
      const result = sanitizeObject({ a: { b: { c: '<span>xss</span>' } } });
      expect(result.a.b.c).not.toContain("<span>");
      expect(result.a.b.c).toContain("&lt;span&gt;");
    });
  });

  describe("truncate", () => {
    it("returns original string if shorter than max", () => {
      expect(truncate("hello", 10)).toBe("hello");
    });

    it("returns original string if equal to max", () => {
      expect(truncate("hello", 5)).toBe("hello");
    });

    it("truncates long strings with ellipsis", () => {
      expect(truncate("hello world", 5)).toBe("hello…");
    });

    it("handles empty string", () => {
      expect(truncate("", 10)).toBe("");
    });

    it("handles max of 1", () => {
      expect(truncate("hello", 1)).toBe("h…");
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
