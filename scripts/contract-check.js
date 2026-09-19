#!/usr/bin/env node

/**
 * Deterministic guard for the Aqarat OS application contract.
 *
 * This intentionally fails while known legacy runtime contracts remain in
 * application source. It detects runtime database usage, not incidental UI
 * vocabulary such as a field label named "area".
 *
 * Do not add compatibility-table exceptions here. Migrate the caller instead.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SCAN_ROOTS = ["src"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRS = new Set([
  "node_modules",
  ".next",
  "coverage",
  "test-results",
  "__tests__",
  "tests",
]);

const legacyRelationPatterns = [
  /\.from\(["'](?:offices|users|zones|property_types|property_images|property_owners|contact_requests|property_favorites|rate_limit_state)["']\)/g,
  /\.rpc\(["']increment_rate_limit["']/g,
];

const legacyStatusPattern = /\.eq\(["']status["']\s*,\s*["']available["']\)/g;
const legacyPropertyFields = new Set([
  "is_active",
  "zone_id",
  "property_type_id",
  "office_id",
  "area",
  "street",
]);

// Match individual Supabase/PostgREST calls so a legitimate field such as area_m2
// cannot be flagged merely because "area" appears elsewhere nearby.
const dbCallPattern = /\.(?:select|eq|neq|gt|gte|lt|lte|in|order|match|contains)\((?:[^()'\"]|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')*\)/gs;
const legacyTypePattern = /export\s+interface\s+Database\s*\{/g;
const retiredApiPatterns = [
  /\/api\/(?:activity|analytics|export|messages|notifications|commissions|referrals)(?:[/?`"'])/g,
  /from=["']@\/components\/dashboard\/(?:CommissionsClient|CommissionsClientWrapper|MessagesClient|MessagesClientWrapper|NotificationsClient|NotificationsClientWrapper|OffersClient|OffersClientWrapper|ReferralsClient|ActivityFeed)["']/g,
  /import\s+(?:.*?\s+from\s+)?["'](?:\.\/|@\/).*?(?:CommissionsClient|MessagesClient|NotificationsClient|OffersClient|ReferralsClient|ActivityFeed)["']/g,
];
const retiredRouteFiles = new Map([
  ["src/app/[locale]/dashboard/commissions/page.tsx", "redirect("],
  ["src/app/[locale]/dashboard/messages/page.tsx", "redirect("],
  ["src/app/[locale]/dashboard/notifications/page.tsx", "redirect("],
  ["src/app/[locale]/dashboard/offers/page.tsx", "redirect("],
  ["src/app/[locale]/dashboard/referrals/page.tsx", "redirect("],
  ["src/app/[locale]/dashboard/favorites/page.tsx", "redirect("],
  ["src/app/[locale]/dashboard/saved-searches/page.tsx", "redirect("],
  ["src/app/[locale]/investors/compare-offices/page.tsx", "redirect("],
]);


function walk(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...walk(absolute));
    else if (EXTENSIONS.has(path.extname(entry.name))) result.push(absolute);
  }
  return result;
}

function exactLegacyFieldInCall(call) {
  const stringLiterals = call.match(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g) || [];

  for (const literal of stringLiterals) {
    const value = literal.slice(1, -1);

    for (const field of value.split(",").map((part) => part.trim())) {
      if (legacyPropertyFields.has(field)) return field;
    }

    if (legacyPropertyFields.has(value)) return value;
  }

  return null;
}

function scanFile(file) {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (relative.endsWith(".test.ts") || relative.endsWith(".test.tsx") || relative.includes("/__tests__/")) {
    return [];
  }

  const text = fs.readFileSync(file, "utf8");
  const findings = [];
  for (const pattern of retiredApiPatterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ file: relative, match: match[0], kind: "retired runtime surface" });
    }
  }


  for (const pattern of legacyRelationPatterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ file: relative, match: match[0], kind: "legacy relation/function" });
    }
  }

  for (const match of text.matchAll(legacyStatusPattern)) {
    findings.push({ file: relative, match: match[0], kind: "legacy property status" });
  }

  for (const match of text.matchAll(dbCallPattern)) {
    const legacyField = exactLegacyFieldInCall(match[0]);
    if (legacyField) {
      findings.push({ file: relative, match: match[0], kind: "legacy property field" });
    }
  }

  if (retiredRouteFiles.has(relative)) {
    const required = retiredRouteFiles.get(relative);
    if (!text.includes(required)) {
      findings.push({ file: relative, match: required, kind: "retired route must remain fail-closed" });
    }
  }

  if (relative === "src/lib/supabase/types.ts") {
    for (const match of text.matchAll(legacyTypePattern)) {
      findings.push({ file: relative, match: match[0], kind: "legacy generated/manual database contract" });
    }
  }

  return findings;
}

const files = SCAN_ROOTS
  .map((relative) => path.join(ROOT, relative))
  .filter(fs.existsSync)
  .flatMap(walk);

const findings = files.flatMap(scanFile);

if (findings.length === 0) {
  console.log("Schema contract check: PASS — no known legacy Aqarat OS contract references found.");
  process.exit(0);
}

const unique = new Map();
for (const finding of findings) {
  const key = `${finding.file}|${finding.kind}|${finding.match}`;
  unique.set(key, finding);
}

console.error(`Schema contract check: FAIL — ${unique.size} known legacy contract reference(s) remain.`);
for (const finding of unique.values()) {
  console.error(`- ${finding.file}: ${finding.kind}: ${finding.match}`);
}
console.error("Migrate the caller to the authoritative Aqarat OS contract; do not recreate legacy tables/functions or re-enable retired runtime surfaces solely to satisfy this guard.");
process.exit(1);
