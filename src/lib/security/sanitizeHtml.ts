/**
 * HTML sanitization utilities.
 *
 * - `sanitizeHtml` uses DOMPurify to strip dangerous tags, event handlers,
 *   and `javascript:` URLs while preserving safe inline markup.
 * - `sanitizeJsonLd` escapes HTML entities in every string value of a JSON-LD
 *   object so that the serialised JSON cannot be used for XSS via
 *   structured-data injection.
 * - `escapeHtmlEntities` provides simple entity escaping for non-HTML contexts.
 */
import DOMPurify from "isomorphic-dompurify";

// Strip dangerous CSS expressions and javascript: URLs from style attributes.
// DOMPurify doesn't sanitize CSS values by default, so we post-process.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.nodeType === 1 && node.getAttribute("style")) {
    const style = node.getAttribute("style") || "";
    if (/expression\s*\(|url\s*\(\s*["']?\s*javascript\s*:/i.test(style)) {
      node.removeAttribute("style");
    }
  }
});

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Escape HTML entities in a string. */
export function escapeHtmlEntities(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* -------------------------------------------------------------------------- */
/*  sanitizeHtml (DOMPurify)                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Sanitize HTML using DOMPurify.
 *
 * Allows safe structural/formatting tags while stripping dangerous elements
 * (script, iframe, object, embed, form, etc.), event handlers, and
 * javascript:/vbscript:/data: URLs.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Block-level
      "p", "div", "span", "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "dl", "dt", "dd", "table", "thead", "tbody", "tr", "td", "th",
      "caption", "colgroup", "col",
      // Inline
      "a", "img", "strong", "em", "b", "i", "u", "br", "hr",
      "sub", "sup", "small", "abbr", "mark", "time",
      // Sectioning
      "article", "aside", "figure", "figcaption", "header", "footer",
      "main", "nav", "section", "details", "summary", "address",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "class", "id", "style",
      "width", "height", "colspan", "rowspan", "scope", "abbr",
      "datetime", "open",
    ],
    // DOMPurify blocks javascript:/vbscript:/data: by default
    // Event handlers (onclick, onerror, etc.) are stripped by default
  });
}

/* -------------------------------------------------------------------------- */
/*  sanitizeJsonLd                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Deep-escape all string values in a JSON-LD object so HTML entities are
 * safe to embed in a `<script type="application/ld+json">` block.
 */
export function sanitizeJsonLd(jsonLd: Record<string, unknown>): string {
  const escaped = deepEscape(jsonLd, new WeakSet());
  return JSON.stringify(escaped);
}

/**
 * Deep-escape with cycle detection to prevent infinite recursion.
 */
function deepEscape(value: unknown, seen: WeakSet<object>): unknown {
  if (typeof value === "string") {
    return escapeHtmlEntities(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => deepEscape(v, seen));
  }
  if (value !== null && typeof value === "object") {
    // Cycle detection - if we've seen this object before, return a placeholder
    if (seen.has(value as object)) {
      return "[Circular]";
    }
    seen.add(value as object);

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = deepEscape(val, seen);
    }
    return result;
  }
  return value;
}
