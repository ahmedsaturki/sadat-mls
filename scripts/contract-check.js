#!/usr/bin/env node

/**
 * Deterministic guard for the Aqarat OS application contract.
 *
 * This intentionally fails while the known legacy runtime contract remains in
 * application source. The goal is to make schema drift explicit in CI instead
 * of allowing E2E to discover it indirectly.
 *
 * Do not add compatibility-table exceptions here. Migrate the caller instead.
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.cwd();
const SCAN_ROOTS = ["src/app", "src/components", "src/lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const IGNORED_DIRS = new Set(["node_modules", ".next", "coverage", "test-results"]);

const legacyRelationPatterns = [
  /\.from\(["'](?:offices|users|zones|property_types|property_images|property_owners|contact_requests|property_favorites|rate_limit_state)["']\)/g,
  /\.rpc\(["']increment_rate_limit["']/g,
];

const legacyPropertyPatterns = [
  /\.eq\(["']status["']\s*,\s*["']available["']\)/g,
  /["'](?:is_active|zone_id|property_type_id|office_id|area|street)["']/g,
];

const forbiddenLegacyTypeFiles = new Set(["src/lib/supabase/types.ts"]);

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

function scanFile(file) {
  const relative = path.relative(ROOT, file).replaceAll(path.sep, "/");
  if (relative.endsWith(".test.ts") || relative.endsWith(".test.tsx")) return [];

  const text = fs.readFileSync(file, "utf8");
  const findings = [];

  for (const pattern of legacyRelationPatterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ file: relative, match: match[0], kind: "legacy relation/function" });
    }
  }

  for (const pattern of legacyPropertyPatterns) {
    for (const match of text.matchAll(pattern)) {
      findings.push({ file: relative, match: match[0], kind: "legacy property field/status" });
    }
  }

  if (forbiddenLegacyTypeFiles.has(relative)) {
    findings.push({
      file: relative,
      match: "legacy Database interface",
      kind: "legacy generated/manual database contract",
    });
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
console.error("Migrate the caller to the authoritative Aqarat OS contract; do not recreate legacy tables/functions solely to satisfy this guard.");
process.exit(1);
