import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "@/lib/security/sanitizeHtml";

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
});
