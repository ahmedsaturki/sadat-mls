#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

function run(script, args) {
  return execFileSync(process.execPath, [path.join(root, script), ...args], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 30_000,
  });
}

const componentDryRun = run("scripts/adapt-component.js", [
  "1323",
  "Button",
  "--dry-run",
  "--retry",
  "7",
]);
if (!componentDryRun.includes("DRY-RUN") || !componentDryRun.includes("Retry limit = 7")) {
  throw new Error("adapt-component dry-run contract failed");
}

const batchDryRun = run("scripts/adapt-all.js", [
  "--dry-run",
  "--retry",
  "7",
]);
if (!batchDryRun.includes("DRY-RUN") || !batchDryRun.includes("retry limit 7")) {
  throw new Error("adapt-all dry-run contract failed");
}

console.log("Adapter CLI smoke: PASS");
