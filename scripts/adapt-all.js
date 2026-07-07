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
 *
 * Reads a JSON manifest of { id, name, description } entries and runs
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
  const { id, name, description } = entry;
  console.log('\n➡️  Adapting', name, '(id', id + ')', description);
  try {
    if (dryRun) {
      // In dry-run mode, just show what would be executed
      const apiKeyPart = apiKey ? ` --api-key ${apiKey}` : '';
      const cmd = `node scripts/adapt-component.js ${id} ${name}${apiKeyPart}`;
      info(`DRY-RUN: Would execute: ${cmd}`);
    } else {
      // Execute the actual adaptation
      execSync(`node scripts/adapt-component.js ${id} ${name} ${apiKey ? `--api-key ${apiKey}` : ''}`, {
        cwd: ROOT,
        stdio: 'inherit',
        timeout: 120000,
      });
      success++;
    }
  } catch (err) {
    failed++;
    failures.push({ name, id, error: err.message });
    warn(`⚠️  Failed to adapt`, name, '-', err.message);
  }
}

info('\n📊 Summary:');
info(`  ✅ Success: ${success}`);
info(`  ❌ Failed : ${failed}`);
if (failures.length) {
  fail('📋 Failures:');
  failures.forEach((f) => warn(` - ${f.name} (id ${f.id}): ${f.error}`));
}
process.exit(failed ? 1 : 0);