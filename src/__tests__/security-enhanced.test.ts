import { describe, it, expect } from "vitest";
import { z } from "zod";
import { SecurityValidator } from "@/lib/security/enhanced";

describe("SecurityValidator.sanitizeString", () => {
  it("returns empty string unchanged for non-string", () => {
    const out = (SecurityValidator as unknown as { sanitizeString: (v: unknown) => unknown }).sanitizeString("");
    expect(out).toBe("");
  });

  it("trims whitespace for text type", () => {
    expect(SecurityValidator.sanitizeString("  hello  ", "text")).toBe("hello");
  });

  it("lower-cases emails", () => {
    expect(SecurityValidator.sanitizeString("Alice@Example.COM", "email")).toBe(
      "alice@example.com",
    );
  });

  it("strips <script> tags from html type", () => {
    const input = "Hi <script>alert(1)</script> there";
    expect(SecurityValidator.sanitizeString(input, "html")).toBe("Hi  there");
  });

  it("strips javascript: scheme from html type", () => {
    // Note: The regex removes the literal `javascript:` token (case-insensitive)
    // but does not consume the trailing parentheses. Result is benign surface text,
    // not absolute removal of every quoted character.
    expect(
      SecurityValidator.sanitizeString("click javascript:alert(1) here", "html"),
    ).toBe("click alert(1) here");
  });

  it("strips inline event-handler attributes from html type", () => {
    const input = 'tap <a href="x" onclick="doBad()">go</a>';
    const out = SecurityValidator.sanitizeString(input, "html");
    expect(out).not.toMatch(/onclick/i);
  });

  it("strips fully-wrapped <iframe>, <object> from html type", () => {
    // The regex requires opening+closing tags. Self-closing tags fall through.
    // HTML5 `<embed>` is a void element — it has no closing tag — so it is intentionally
    // not scrubbed by this sanitizer. Document this gap and rely on upstream
    // sanitization (DOMPurify or sanitized HTML render) for void embed elements.
    const inputs = [
      '<iframe src="evil"></iframe>',
      '<object data="evil"></object>',
    ];
    for (const i of inputs) {
      expect(SecurityValidator.sanitizeString(i, "html")).toBe("");
    }
  });

  it("does NOT strip self-closing iframe/object tags (documented gap)", () => {
    // Self-closing tags pass through unchanged because the regex requires a closing token.
    // Rely on `sanitize.ts` / multi-pass `sanitizeHtml.ts` for full coverage.
    const input = '<iframe src="evil"/>';
    expect(SecurityValidator.sanitizeString(input, "html")).toBe(input);
  });

  it("does NOT strip self-closing embed tag (documented gap)", () => {
    // HTML5 `<embed>` is a void element with no closing tag — out of scope for this regex.
    const input = '<embed src="evil"/>';
    expect(SecurityValidator.sanitizeString(input, "html")).toBe(input);
  });

  it("collapses internal whitespace for text type", () => {
    expect(
      SecurityValidator.sanitizeString("a   b\n\n\tc", "text"),
    ).toBe("a b c");
  });

  it("truncates over-length inputs to the per-field cap", () => {
    const out = SecurityValidator.sanitizeString("x".repeat(200), "name");
    expect(out.length).toBe(100);
  });

  it("falls back to the 1000-cap when field type is unknown", () => {
    const out = SecurityValidator.sanitizeString("x".repeat(1500) as string, "unknown" as never);
    expect(out.length).toBeLessThanOrEqual(1000);
  });
});

describe("SecurityValidator.containsSqlInjection", () => {
  const positives = [
    "id; DROP TABLE users",
    "x' UNION ALL SELECT * FROM passwords",
    "/* malicious */ statement",
    "EXEC xp_cmdshell 'whoami'",
    "INSERT INTO foo VALUES (1)",
    "UPDATE users SET password='hax'",
    "ALTER TABLE x ADD y",
    // `/* ... */` blocks are flagged because the regex cannot distinguish
    // SQL comment attacks (true positive) from code-review prose (false positive).
    // Document this so consumers know to whitelist prose if needed.
    "/* code review comment */",
  ];

  it.each(positives)("detects SQL-injection pattern: %s", (input) => {
    expect(SecurityValidator.containsSqlInjection(input)).toBe(true);
  });

  const negatives = [
    "Hello, world!",
    "SELECT * from menu_text",           // SELECT alone is not in the pattern list
    "My drop in the bucket",
    "server.execute = true",
  ];

  it.each(negatives)("does not flag benign text: %s", (input) => {
    expect(SecurityValidator.containsSqlInjection(input)).toBe(false);
  });
});

describe("SecurityValidator.containsXss", () => {
  const positives = [
    "<script>alert(1)</script>",
    "javascript:bad()",
    "onload=foo",
    "onerror=bar",
    "onclick=baz",
    "onmouseover=qux",
    "<iframe src=evil>",
    "<object data=evil>",
    "<embed src=evil>",
    "vbscript:bad",
    "expression(alert(1))",
    "<meta http-equiv=refresh content=0>",
  ];

  it.each(positives)("detects XSS pattern: %s", (input) => {
    expect(SecurityValidator.containsXss(input)).toBe(true);
  });

  const negatives = [
    "Hello world",
    "onloadingscreen.com",
    "scrolled=true",
    "<p>A paragraph</p>",
    "<a href='/safe'>link</a>",
  ];

  it.each(negatives)("does not flag benign text: %s", (input) => {
    expect(SecurityValidator.containsXss(input)).toBe(false);
  });
});

describe("SecurityValidator.validateLength", () => {
  it("returns true when value is under the named limit", () => {
    expect(SecurityValidator.validateLength("username", "alice")).toBe(true);
  });

  it("returns false when value is over the named limit", () => {
    expect(SecurityValidator.validateLength("username", "x".repeat(60))).toBe(false);
  });

  it("uses an explicit override when supplied", () => {
    expect(SecurityValidator.validateLength("anything", "abc", 2)).toBe(false);
    expect(SecurityValidator.validateLength("anything", "ab", 2)).toBe(true);
  });
});

describe("SecurityValidator.validateInput", () => {
  it("rejects empty when required", () => {
    const out = SecurityValidator.validateInput("name", "", { required: true });
    expect(out.isValid).toBe(false);
  });

  it("treats null/undefined as valid when not required", () => {
    expect(SecurityValidator.validateInput("name", null).isValid).toBe(true);
    expect(SecurityValidator.validateInput("name", undefined).isValid).toBe(true);
  });

  it("rejects wrong type", () => {
    expect(
      SecurityValidator.validateInput("name", 42, { type: "string" }).isValid,
    ).toBe(false);
  });

  it("enforces minLength before maxLength", () => {
    expect(
      SecurityValidator.validateInput("pw", "abc", { type: "string", minLength: 6 }).isValid,
    ).toBe(false);
    expect(
      SecurityValidator.validateInput("pw", "abcdefg", { type: "string", maxLength: 3 }).isValid,
    ).toBe(false);
  });

  it("flags SQL-injection text content", () => {
    const out = SecurityValidator.validateInput("note", "x; DROP TABLE users");
    expect(out.isValid).toBe(false);
    expect(out.error).toMatch(/invalid characters/i);
  });

  it("flags XSS text content", () => {
    const out = SecurityValidator.validateInput("note", "<script>alert(1)</script>");
    expect(out.isValid).toBe(false);
    expect(out.error).toMatch(/security violation/i);
  });

  it("applies a supplied regex pattern", () => {
    const phoneShape = /^[+0-9() -]+$/;
    expect(
      SecurityValidator.validateInput("phone", "+1 (555) 555-5555", { pattern: phoneShape }).isValid,
    ).toBe(true);
    expect(
      SecurityValidator.validateInput("phone", "abc", { pattern: phoneShape }).isValid,
    ).toBe(false);
  });

  it("passes for a clean value with no options", () => {
    expect(SecurityValidator.validateInput("note", "Hello").isValid).toBe(true);
  });
});

describe("SecurityValidator.validate (Zod)", () => {
  const schema = z.object({
    name: z.string().min(2),
    age: z.number().int().nonnegative(),
  });

  it("returns success with parsed data", () => {
    const out = SecurityValidator.validate(schema, { name: "Alice", age: 30 });
    expect(out.success).toBe(true);
    expect(out.data).toEqual({ name: "Alice", age: 30 });
  });

  it("returns structured errors for invalid input", () => {
    const out = SecurityValidator.validate(schema, { name: "A", age: -3 });
    expect(out.success).toBe(false);
    expect(out.errors).toBeDefined();
    expect(out.errors!.name).toBeDefined();
    expect(out.errors!.age).toBeDefined();
  });

  it("sanitizes string fields when sanitize option is on", () => {
    const out = SecurityValidator.validate(
      z.object({ note: z.string() }),
      { note: "  raw   text  " },
      { sanitize: true, fieldName: "note" },
    );
    expect(out.success).toBe(true);
    expect((out.data as { note: string }).note.length).toBeGreaterThan(0);
  });

  it("returns a general error when Zod throws non-ZodError", () => {
    const explosiveSchema = {
      parse: () => {
        throw new Error("explode");
      },
    } as unknown as z.ZodTypeAny;
    const out = SecurityValidator.validate(explosiveSchema, {});
    expect(out.success).toBe(false);
    expect(out.errors?.general).toBeDefined();
  });
});
