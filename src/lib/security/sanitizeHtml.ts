/**
 * HTML sanitization utilities.
 *
 * - `sanitizeHtml` strips dangerous tags, event handlers, and `javascript:` URLs
 *   while preserving safe inline markup.
 * - `sanitizeJsonLd` escapes HTML entities in every string value of a JSON-LD
 *   object so that the serialised JSON cannot be used for XSS via
 *   structured-data injection.
 */

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

/** Escape HTML entities in a string. */
function escapeHtmlEntities(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* -------------------------------------------------------------------------- */
/*  sanitizeHtml                                                              */
/* -------------------------------------------------------------------------- */

/** Tags whose *entire* content (including children) is removed. */
const STRIP_TAGS = new Set([
  "script",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "textarea",
  "button",
  "select",
  "style",
  "link",
  "meta",
  "base",
  "applet",
  "noscript",
  "noembed",
]);

/** Tags that are allowed to remain in the output. */
const SAFE_TAGS = new Set([
  "p",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "strong",
  "em",
  "b",
  "i",
  "u",
  "br",
  "hr",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
  "caption",
  "colgroup",
  "col",
  "blockquote",
  "pre",
  "code",
  "dl",
  "dt",
  "dd",
  "sub",
  "sup",
  "small",
  "abbr",
  "address",
  "article",
  "aside",
  "figure",
  "figcaption",
  "header",
  "footer",
  "main",
  "nav",
  "section",
  "details",
  "summary",
  "mark",
  "time",
]);

/** Attributes that are always removed (event handlers). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const EVENT_HANDLER_RE = /^on[a-z]/i;

/** URL values that execute JS. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const JS_URL_RE = /^\s*javascript\s*:/i;

/** Dangerous style values (CSS expressions). */
const STYLE_EXPR_RE = /expression\s*\(|url\s*\(\s*["']?\s*javascript\s*:/i;

/** Allowed `href` / `src` schemes. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SAFE_SCHEMES = /^(https?|mailto|tel|data(?!:.*\.(?:exe|bat|cmd|scr))|blob|\/|#)/i;

/**
 * Recursively walk the DOM produced by a temporary wrapper and return only
 * the safe inner HTML.
 *
 * Because we are in a non-browser environment we use a regex-based state
 * machine rather than a real DOM parser.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return "";

  // 1. Strip dangerous tags and their contents (including nested).
  let result = stripDangerousTags(html);

  // 2. Remove event-handler attributes.
  result = stripEventHandlers(result);

  // 3. Remove `javascript:` URLs.
  result = stripJsUrls(result);

  // 4. Strip dangerous style attributes.
  result = stripDangerousStyles(result);

  // 5. Remove tags that are not in the safe list (but keep their text content).
  result = stripUnsafeTags(result);

  return result;
}

/* -------------------------------------------------------------------------- */
/*  Internal sanitisation passes                                               */
/* -------------------------------------------------------------------------- */

/**
 * Remove dangerous tags and all content between their opening and closing
 * tags. Handles self-closing tags too.
 */
function stripDangerousTags(html: string): string {
  for (const tag of STRIP_TAGS) {
    // Opening + optional self-closing + content + closing.
    const re = new RegExp(
      `<${tag}(?:\\s[^>]*)?\\s*/?>[\\s\\S]*?</${tag}\\s*>|<${tag}(?:\\s[^>]*)?\\s*/?>`,
      "gi",
    );
    html = html.replace(re, "");
  }
  return html;
}

/** Remove any attribute that looks like an event handler (`onclick`, …). */
function stripEventHandlers(html: string): string {
  return html.replace(/\s+on[a-z][a-z0-9_]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}

/** Remove `href`, `src`, `action`, and `formaction` that use `javascript:`. */
function stripJsUrls(html: string): string {
  return html.replace(
    /\b(href|src|action|formaction|data|poster|background)\s*=\s*(["'])\s*javascript\s*:[^"'\s>]*\2/gi,
    "",
  );
}

/** Remove `style` attributes that contain CSS expressions or `javascript:` URLs. */
function stripDangerousStyles(html: string): string {
  return html.replace(
    /\s+style\s*=\s*(["'])[\s\S]*?\1/gi,
    (match) => {
      if (STYLE_EXPR_RE.test(match)) return "";
      return match;
    },
  );
}

/**
 * Remove any tag not in `SAFE_TAGS`. The *text content* of the removed tag
 * is preserved.
 */
function stripUnsafeTags(html: string): string {
  // Match opening/closing/self-closing tags.
  return html.replace(
    /<\/?([a-zA-Z][a-zA-Z0-9]*(?:\s[^>]*)?)\s*\/?>/g,
    (full, inner) => {
      // Extract just the tag name (first word).
      const tagName = inner.split(/[\s/>]/)[0].toLowerCase();

      if (SAFE_TAGS.has(tagName)) {
        return full; // keep as-is
      }
      // For safe-ish closing tags we keep them; for unknown ones we strip
      // the whole tag but keep any text between the opening and closing.
      if (full.startsWith("</")) return ""; // closing tag – just remove
      // Opening or self-closing – remove the tag itself
      return "";
    },
  );
}

/* -------------------------------------------------------------------------- */
/*  sanitizeJsonLd                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Deep-escape all string values in a JSON-LD object so HTML entities are
 * safe to embed in a `<script type="application/ld+json">` block.
 */
export function sanitizeJsonLd(jsonLd: Record<string, unknown>): string {
  const escaped = deepEscape(jsonLd);
  return JSON.stringify(escaped);
}

function deepEscape(value: unknown): unknown {
  if (typeof value === "string") {
    return escapeHtmlEntities(value);
  }
  if (Array.isArray(value)) {
    return value.map(deepEscape);
  }
  if (value !== null && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = deepEscape(val);
    }
    return result;
  }
  return value;
}
