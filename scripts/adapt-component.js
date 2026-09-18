#!/usr/bin/env node
/**
 * Adapt 21st.dev components into custom Tailwind v4 format.
 *
 * Usage:
 *   node scripts/adapt-component.js <component-id> <output-name> [--retry <count>] [--api-key <key>] [--dry-run] [--force]
 *
 * Dry-run is strictly side-effect free: no network calls and no file writes.
 */
require("dotenv").config();

const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const args = process.argv.slice(2);

function readOption(name) {
  const index = args.indexOf(name);
  return index === -1 ? null : args[index + 1] ?? null;
}

const COMPONENT_ID = args[0];
const OUTPUT_NAME = (args[1] || "AdaptedComponent").replace(/^--/, "");
const RETRY_COUNT = Math.max(1, Number.parseInt(readOption("--retry") || "3", 10) || 3);
const API_KEY = readOption("--api-key") || process.env.API_KEY_21ST;
const DRY_RUN = args.includes("--dry-run");
const FORCE = args.includes("--force");

if (!COMPONENT_ID) {
  console.error("Component ID is required");
  process.exit(1);
}
if (!OUTPUT_NAME) {
  console.error("Output component name is required");
  process.exit(1);
}

const OUTPUT_DIR = path.join(__dirname, "..", "src", "components", "ui");
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.tsx`);
const COMPONENTS_FILE = path.join(__dirname, "..", "components.json");

if (DRY_RUN) {
  console.log(`DRY-RUN: Would fetch component ${COMPONENT_ID}, transform it, and write ${path.relative(process.cwd(), OUTPUT_FILE)}.`);
  console.log(`DRY-RUN: Retry limit = ${RETRY_COUNT}; force = ${FORCE ? "yes" : "no"}.`);
  process.exit(0);
}

if (!API_KEY) {
  console.error("API_KEY_21ST environment variable or --api-key is required.");
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const sleepSync = (milliseconds) => {
  const buffer = new SharedArrayBuffer(4);
  Atomics.wait(new Int32Array(buffer), 0, 0, milliseconds);
};

const transformations = [
  [/bg-primary/g, "bg-blue-600"],
  [/text-primary-foreground/g, "text-white"],
  [/bg-secondary/g, "bg-gray-200"],
  [/bg-destructive/g, "bg-red-600"],
  [/bg-outline/g, "border-2 border-gray-300"],
  [/bg-ghost/g, "bg-transparent"],
  [/bg-link/g, "text-blue-600"],
  [/rounded-md/g, "rounded-lg"],
  [/transition-colors/g, "transition-colors duration-200 ease-in-out"],
  [/focus-visible:ring-2/g, "focus-visible:ring-2 focus-visible:ring-blue-500"],
  [/disabled:opacity-50/g, "disabled:opacity-50 cursor-not-allowed"],
];

function fetchComponent() {
  let lastError = null;

  for (let attempt = 1; attempt <= RETRY_COUNT; attempt += 1) {
    try {
      return execFileSync("21st", ["get", COMPONENT_ID, "--api-key", API_KEY], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        timeout: 30_000,
        windowsHide: true,
      });
    } catch (error) {
      lastError = error;
      console.warn(`API call failed (attempt ${attempt}/${RETRY_COUNT}): ${error instanceof Error ? error.message : String(error)}`);
      if (attempt < RETRY_COUNT) {
        const backoff = Math.min(30_000, 2 ** attempt * 1_000);
        sleepSync(backoff);
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Failed to fetch component");
}

function extractCode(rawOutput) {
  const match = rawOutput.match(/```tsx\s*\n([\s\S]*?)\n```/m);
  if (!match) throw new Error("Could not find a TypeScript JSX code block in fetched component.");
  return match[1];
}

function transform(code) {
  let output = code;
  for (const [pattern, replacement] of transformations) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

function contentHash(value) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

let rawOutput;
try {
  console.log(`Fetching component ${COMPONENT_ID} from 21st.dev...`);
  rawOutput = fetchComponent();
  const componentCode = extractCode(rawOutput);
  const transformed = transform(componentCode);
  const metadata = [
    `// Adapted from 21st.dev component ${COMPONENT_ID}`,
    `// Source content SHA-256: ${contentHash(componentCode)}`,
    "// Transform: shadcn.ui → Tailwind v4 custom",
    "",
  ].join("\n");
  const output = metadata + transformed + "\n";

  if (fs.existsSync(OUTPUT_FILE) && !FORCE) {
    const existing = fs.readFileSync(OUTPUT_FILE, "utf8");
    if (existing === output) {
      console.log(`No change for ${OUTPUT_NAME}; existing generated file is already identical.`);
      process.exit(0);
    }
    throw new Error(
      `${OUTPUT_FILE} already exists with different content. Use --force only when an intentional replacement is required.`,
    );
  }

  const tempFile = `${OUTPUT_FILE}.tmp`;
  fs.writeFileSync(tempFile, output, "utf8");
  fs.renameSync(tempFile, OUTPUT_FILE);
  console.log(`Adapted component written to ${OUTPUT_FILE}`);

  if (fs.existsSync(COMPONENTS_FILE)) {
    const components = JSON.parse(fs.readFileSync(COMPONENTS_FILE, "utf8"));
    components.aliases = components.aliases || {};
    components.aliases[`@${path.relative(path.join(__dirname, ".."), OUTPUT_FILE).replaceAll(path.sep, "/").replace(/\.tsx$/, "")}`] =
      `@${path.relative(path.join(__dirname, ".."), OUTPUT_FILE).replaceAll(path.sep, "/").replace(/\.tsx$/, "")}`;
    fs.writeFileSync(COMPONENTS_FILE, JSON.stringify(components, null, 2) + "\n", "utf8");
  }

  console.log("Adaptation complete.");
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
