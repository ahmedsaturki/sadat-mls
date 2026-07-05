import { describe, it, expect } from "vitest";
import { sanitizeHtml, sanitizeJsonLd } from "@/lib/security/sanitizeHtml";

describe("sanitizeHtml", () => {
  it("allows safe HTML tags", () => {
    const input = "<p>Hello <strong>world</strong></p>";
    const result = sanitizeHtml(input);
    expect(result).toContain("<p>");
    expect(result).toContain("<strong>");
    expect(result).toContain("</p>");
    expect(result).toContain("</strong>");
  });

  it("strips script tags", () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>");
  });

  it("strips iframe tags", () => {
    const input = '<p>Content</p><iframe src="evil.com"></iframe>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<iframe>");
  });

  it("strips event handlers", () => {
    const input = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onclick");
    expect(result).toContain("<p>");
  });

  it("strips javascript: URLs", () => {
    const input = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("allows safe href URLs", () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain("https://example.com");
  });

  it("strips onerror handlers", () => {
    const input = '<img src="x" onerror="alert(1)">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onerror");
  });

  it("strips style tags", () => {
    const input = '<p>Text</p><style>body{display:none}</style>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<style>");
  });

  it("strips dangerous style expressions", () => {
    const input = '<p style="background: url(javascript:alert(1))">Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("javascript:");
  });

  it("handles empty string", () => {
    const result = sanitizeHtml("");
    expect(result).toBe("");
  });

  it("handles plain text without HTML", () => {
    const input = "Hello world";
    const result = sanitizeHtml(input);
    expect(result).toBe("Hello world");
  });

  it("strips object tags", () => {
    const input = '<p>Text</p><object data="evil.swf"></object>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<object>");
  });

  it("strips embed tags", () => {
    const input = '<p>Text</p><embed src="evil.swf">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<embed>");
  });

  it("strips form tags", () => {
    const input = '<p>Text</p><form action="evil.com"><input type="submit"></form>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<form>");
    expect(result).not.toContain("<input>");
  });

  it("allows img tags with safe attributes", () => {
    const input = '<img src="https://example.com/image.jpg" alt="Photo">';
    const result = sanitizeHtml(input);
    expect(result).toContain("<img");
    expect(result).toContain("src=");
    expect(result).toContain("alt=");
  });

  it("strips svg with embedded script", () => {
    const input = '<svg onload="alert(1)"><script>alert(1)</script></svg>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onload");
    expect(result).not.toContain("<script>");
  });

  it("strips data: URLs in href", () => {
    const input = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("data:");
  });

  it("strips vbscript: URLs", () => {
    const input = '<a href="vbscript:alert(1)">Click</a>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("vbscript:");
  });

  it("strips svg onload handlers", () => {
    const input = '<svg onload="alert(1)"><circle></circle></svg>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("onload");
  });

  it("strips nested dangerous tags", () => {
    const input = '<div><p>Hello</p><script>alert(1)</script><p>World</p></div>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("<p>Hello</p>");
    expect(result).toContain("<p>World</p>");
  });

  it("strips case-insensitive script tags", () => {
    const input = '<SCRIPT>alert(1)</SCRIPT>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<SCRIPT>");
  });

  it("strips noscript tags", () => {
    const input = '<noscript><img src=x onerror=alert(1)></noscript>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<noscript>");
  });

  it("strips base tag", () => {
    const input = '<base href="https://evil.com/"><p>Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<base>");
  });

  it("strips link tags", () => {
    const input = '<link rel="stylesheet" href="evil.css"><p>Text</p>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("<link");
  });

  it("allows mailto: links", () => {
    const input = '<a href="mailto:test@example.com">Email</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain("mailto:");
  });

  it("allows tel: links", () => {
    const input = '<a href="tel:+1234567890">Call</a>';
    const result = sanitizeHtml(input);
    expect(result).toContain("tel:");
  });

  it("strips data: URLs in img src", () => {
    const input = '<img src="data:text/html,<script>alert(1)</script>">';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("data:");
  });

  it("strips formaction attribute", () => {
    const input = '<button formaction="javascript:alert(1)">Submit</button>';
    const result = sanitizeHtml(input);
    expect(result).not.toContain("formaction");
  });
});

describe("sanitizeJsonLd", () => {
  it("escapes HTML entities in string values", () => {
    const input = { name: '<script>alert("xss")</script>' };
    const result = sanitizeJsonLd(input);
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
  });

  it("escapes ampersands in URLs", () => {
    const input = { url: "https://example.com?a=1&b=2" };
    const result = sanitizeJsonLd(input);
    expect(result).toContain("&amp;");
  });

  it("handles nested objects", () => {
    const input = { outer: { inner: '<img onerror="alert(1)">' } };
    const result = sanitizeJsonLd(input);
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
  });

  it("handles arrays", () => {
    const input = { items: ["<b>bold</b>", "normal"] };
    const result = sanitizeJsonLd(input);
    expect(result).toContain("&lt;b&gt;");
  });

  it("returns valid JSON", () => {
    const input = { name: "Test", count: 42, active: true };
    const result = sanitizeJsonLd(input);
    const parsed = JSON.parse(result);
    expect(parsed.name).toBe("Test");
    expect(parsed.count).toBe(42);
    expect(parsed.active).toBe(true);
  });

  it("handles circular references", () => {
    const input: Record<string, unknown> = { name: "Test" };
    input.self = input;
    const result = sanitizeJsonLd(input);
    expect(result).toContain("[Circular]");
  });

  it("handles null values", () => {
    const input = { name: "Test", value: null };
    const result = sanitizeJsonLd(input);
    const parsed = JSON.parse(result);
    expect(parsed.value).toBeNull();
  });

  it("handles numeric values", () => {
    const input = { price: 1500000, area: 250 };
    const result = sanitizeJsonLd(input);
    const parsed = JSON.parse(result);
    expect(parsed.price).toBe(1500000);
    expect(parsed.area).toBe(250);
  });
});
