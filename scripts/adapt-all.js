#!/usr/bin/env node
/**
 * Wrapper: adapt an entire directory/manifest of 21st.dev components
 * into the project's custom Tailwind v4 component style.
 *
 * Usage:
 *   node scripts/adapt-all.js
 *   node scripts/adapt-all.js --manifest scripts/component-manifest.json
 *   node scripts/adapt-all.js --dry-run
 *   node scripts/adapt-all.js --dry-run --manifest /path/to/manifest.json
 *   node scripts/adapt-all.js --retry 5 --dry-run
 *
 * Reads a JSON manifest of { id, name, description, version } entries and runs
 * scripts/adapt-component.js for each, continuing on individual failures
 * and reporting a summary at the end.
 *
 * When --dry-run is provided, performs all steps except actual transformation
 * - validates manifest, parses options, prints what would be executed
 * - shows full commands that would be run for each component
 * - skips network requests and file system modifications
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const ROOT = process.cwd();
const args = process.argv.slice(2);
const manifestArgIdx = args.indexOf('--manifest');
const manifestArg = manifestArgIdx !== -1 ? args[manifestArgIdx + 1] : 'scripts/component-manifest.json';
const dryRun = args.includes('--dry-run');
const retryArg = args.indexOf('--retry');
const RETRY_COUNT = retryArg !== -1 ? parseInt(args[retryArg + 1], 10) || 3 : 3;

const manifestPath = path.resolve(ROOT, manifestArg);
if (!fs.existsSync(manifestPath)) {
  console.error('❌ Manifest not found:', manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const entries = manifest.components || [];
if (!entries.length) {
  console.error('❌ No components listed in manifest');
  process.exit(1);
}

const apiKey = process.env.API_KEY_21ST;
if (!apiKey && !dryRun) {
  console.error('❌ API_KEY_21ST is not set. Add it to .env (copy from .env.example).');
  process.exit(1);
}

let success = 0;
let failed = 0;
const failures = [];

const ok = (msg) => console.log(`\x1b[32m${msg}\x1b[0m`);
const warn = (msg) => console.log(`\x1b[33m${msg}\x1b[0m`);
const fail = (msg) => console.log(`\x1b[31m${msg}\x1b[0m`);
const info = (msg) => console.log(`\x1b[36m${msg}\x1b[0m`);

for (const entry of entries) {
  const { id, name, description, version } = entry;
  console.log('\n➡️  Adapting', name, '(id', id, 'version', version, ')');
  
  if (dryRun) {
    info(`DRY-RUN: Would adapt ${name} (id ${id}, version ${version}) with retry limit ${RETRY_COUNT}`);
    success++;
    continue;
  }

  try {
    const scriptPath = path.join(__dirname, 'adapt-component.js');
    const commandArgs = [scriptPath, String(id), String(name), '--retry', String(RETRY_COUNT)];
    if (apiKey) commandArgs.push('--api-key', apiKey);
    const result = execSync(process.execPath + ' ' + commandArgs.map((value) => JSON.stringify(value)).join(' '), {
      cwd: ROOT,
      stdio: 'inherit',
      timeout: 120000,
      shell: false,
    });
    void result;
    success++;
  } catch (err) {
    failed++;
    failures.push({ name, id, version, error: err instanceof Error ? err.message : String(err) });
    warn(`⚠️  Failed to adapt`, name, '(id', id, 'version', version, '):', err instanceof Error ? err.message : String(err));
  }
}

info('\n📊 Summary:');
info(`  ✅ Success: ${success}`);
info(`  ❌ Failed : ${failed}`);
if (failures.length) {
  fail('📋 Failures:');
  failures.forEach((f) => warn(` - ${f.name} (id ${f.id}, version ${f.version}): ${f.error}`));
}
process.exit(failed ? 1 : 0);