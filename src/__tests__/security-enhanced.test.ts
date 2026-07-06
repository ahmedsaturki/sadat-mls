import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

const { SecurityValidator } = await import("@/lib/security/enhanced");
const loggerModule = await import("@/lib/logger");

describe("SecurityValidator", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ── validate ──────────────────────────────────────────

  describe("validate", () => {
    const schema = z.object({
      name: z.string(),
      age: z.number(),
    });

    it("returns success with valid data", () => {
      const result = SecurityValidator.validate(schema, { name: "Ahmed", age: 30 });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ name: "Ahmed", age: 30 });
      expect(result.errors).toBeUndefined();
    });

    it("returns failure with invalid Zod data", () => {
      const result = SecurityValidator.validate(schema, { name: "Ahmed" });
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.age).toBeDefined();
    });

    it("returns structured errors by field", () => {
      const result = SecurityValidator.validate(schema, {});
      expect(result.success).toBe(false);
      expect(result.errors!.name).toBeDefined();
      expect(result.errors!.age).toBeDefined();
    });

    it("sanitize option sanitizes strings in output", () => {
      const s = z.object({ text: z.string() });
      const result = SecurityValidator.validate(s, { text: "  hello world  " }, { sanitize: true });
      expect(result.success).toBe(true);
      expect(result.data!.text).toBe("hello world");
    });

    it("fieldName appears in warning log on validation failure", () => {
      SecurityValidator.validate(schema, {}, { fieldName: "userForm" });
      expect(loggerModule.logger.warn).toHaveBeenCalled();
      const msg = (loggerModule.logger.warn as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
      expect(msg).toContain("userForm");
    });
  });

  // ── sanitizeString ────────────────────────────────────

  describe("sanitizeString", () => {
    it("trims whitespace", () => {
      expect(SecurityValidator.sanitizeString("  hello  ")).toBe("hello");
    });

    it("removes <script> tags (html field type)", () => {
      expect(SecurityValidator.sanitizeString("before<script>alert('x')</script>after", "html")).toBe("beforeafter");
    });

    it("removes javascript: URLs (html field type)", () => {
      expect(SecurityValidator.sanitizeString("click javascript:void(0)", "html")).toBe("click void(0)");
    });

    it("removes event handlers onclick= (html field type)", () => {
      const input = 'tap <a href="x" onclick="doBad()">go</a>';
      const out = SecurityValidator.sanitizeString(input, "html");
      expect(out).not.toMatch(/onclick/i);
    });

    it("removes <iframe> (html field type)", () => {
      expect(SecurityValidator.sanitizeString("a<iframe src='evil'></iframe>b", "html")).toBe("ab");
    });

    it("removes <object> (html field type)", () => {
      expect(SecurityValidator.sanitizeString("a<object data='evil'></object>b", "html")).toBe("ab");
    });

    it("lowercases email", () => {
      expect(SecurityValidator.sanitizeString("USER@EXAMPLE.COM", "email")).toBe("user@example.com");
    });

    it("collapses whitespace in text", () => {
      expect(SecurityValidator.sanitizeString("hello   world\t\tthere", "text")).toBe("hello world there");
    });

    it("truncates to field length limit (name: 100)", () => {
      const long = "a".repeat(150);
      const result = SecurityValidator.sanitizeString(long, "name");
      expect(result.length).toBe(100);
    });

    it("truncates to field length limit (email: 254)", () => {
      const long = "a".repeat(300);
      const result = SecurityValidator.sanitizeString(long, "email");
      expect(result.length).toBe(254);
    });

    it("returns non-string input as-is", () => {
      const notAString = 12345 as unknown as string;
      expect(SecurityValidator.sanitizeString(notAString)).toBe(12345);
    });

    it("handles empty string", () => {
      expect(SecurityValidator.sanitizeString("")).toBe("");
    });
  });

  // ── validateLength ────────────────────────────────────

  describe("validateLength", () => {
    it("returns true when within limit", () => {
      expect(SecurityValidator.validateLength("username", "ahmed")).toBe(true);
    });

    it("returns false when over limit", () => {
      expect(SecurityValidator.validateLength("username", "a".repeat(51))).toBe(false);
    });

    it("respects custom maxLength", () => {
      expect(SecurityValidator.validateLength("custom", "a".repeat(10), 5)).toBe(false);
      expect(SecurityValidator.validateLength("custom", "a".repeat(5), 5)).toBe(true);
    });

    it("defaults to 1000 for unknown field", () => {
      expect(SecurityValidator.validateLength("unknown", "a".repeat(1000))).toBe(true);
      expect(SecurityValidator.validateLength("unknown", "a".repeat(1001))).toBe(false);
    });
  });

  // ── containsSqlInjection ──────────────────────────────

  describe("containsSqlInjection", () => {
    it("detects UNION ALL SELECT", () => {
      expect(SecurityValidator.containsSqlInjection("1 UNION ALL SELECT * FROM users")).toBe(true);
    });

    it("detects DROP TABLE", () => {
      expect(SecurityValidator.containsSqlInjection("DROP TABLE users")).toBe(true);
    });

    it("detects INSERT INTO", () => {
      expect(SecurityValidator.containsSqlInjection("INSERT INTO users VALUES (1)")).toBe(true);
    });

    it("detects DELETE FROM", () => {
      expect(SecurityValidator.containsSqlInjection("DELETE FROM users WHERE id=1")).toBe(true);
    });

    it("detects UPDATE ... SET", () => {
      // The regex requires an identifier between UPDATE and SET
      expect(SecurityValidator.containsSqlInjection("UPDATE users SET role='admin'")).toBe(true);
    });

    it("detects ALTER TABLE", () => {
      expect(SecurityValidator.containsSqlInjection("ALTER TABLE users ADD COLUMN")).toBe(true);
    });

    it("detects TRUNCATE TABLE", () => {
      expect(SecurityValidator.containsSqlInjection("TRUNCATE TABLE logs")).toBe(true);
    });

    it("detects semicolon then SELECT", () => {
      expect(SecurityValidator.containsSqlInjection("input; SELECT * FROM users")).toBe(true);
    });

    it("detects SQL comment /* */", () => {
      expect(SecurityValidator.containsSqlInjection("input /* comment */ input")).toBe(true);
    });

    it("returns false for clean input", () => {
      expect(SecurityValidator.containsSqlInjection("Hello world, no SQL here")).toBe(false);
    });
  });

  // ── containsXss ───────────────────────────────────────

  describe("containsXss", () => {
    it("detects <script> tag", () => {
      expect(SecurityValidator.containsXss("<script>alert(1)</script>")).toBe(true);
    });

    it("detects javascript: URI", () => {
      expect(SecurityValidator.containsXss("javascript:alert(1)")).toBe(true);
    });

    it("detects onclick=", () => {
      expect(SecurityValidator.containsXss('<div onclick="steal()">')).toBe(true);
    });

    it("detects onerror=", () => {
      expect(SecurityValidator.containsXss('<img onerror="steal()">')).toBe(true);
    });

    it("detects <iframe", () => {
      expect(SecurityValidator.containsXss("<iframe src='evil'>")).toBe(true);
    });

    it("detects <object", () => {
      expect(SecurityValidator.containsXss("<object data='evil'>")).toBe(true);
    });

    it("detects <embed", () => {
      expect(SecurityValidator.containsXss("<embed src='evil'>")).toBe(true);
    });

    it("detects vbscript:", () => {
      expect(SecurityValidator.containsXss("vbscript:MsgBox(1)")).toBe(true);
    });

    it("returns false for clean input", () => {
      expect(SecurityValidator.containsXss("Hello world, no XSS here")).toBe(false);
    });
  });

  // ── validateInput ─────────────────────────────────────

  describe("validateInput", () => {
    it("returns error when required field is missing", () => {
      const result = SecurityValidator.validateInput("name", "", { required: true });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("required");
    });

    it("returns error on type mismatch", () => {
      const result = SecurityValidator.validateInput("age", 42, { type: "string" });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("string");
    });

    it("returns error when SQL injection detected", () => {
      const result = SecurityValidator.validateInput("query", "1 UNION ALL SELECT * FROM users");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Invalid characters");
    });

    it("returns error when XSS detected", () => {
      const result = SecurityValidator.validateInput("input", "<script>alert(1)</script>");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Security violation");
    });

    it("returns error on pattern mismatch", () => {
      const result = SecurityValidator.validateInput("email", "not-an-email", {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      });
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("format is invalid");
    });

    it("passes for valid input", () => {
      const result = SecurityValidator.validateInput("name", "Ahmed", {
        required: true,
        type: "string",
        minLength: 1,
        maxLength: 50,
      });
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("passes when optional field is null", () => {
      const result = SecurityValidator.validateInput("phone", null);
      expect(result.isValid).toBe(true);
    });
  });
});
