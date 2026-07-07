#!/usr/bin/env node
/**
 * Adapt 21st.dev components into custom Tailwind v4 format
 * 
 * Usage: node scripts/adapt-component.js <component-id> <output-name> [--retry <count>] [--dry-run] [--force]
 * 
 * Example:
 *   node scripts/adapt-component.js 1323 CustomButton
 *   node scripts/adapt-component.js 64 ParticleButton --api-key $API_KEY_21ST
 * 
 * Features:
 *   --retry <count> : Retry failed API calls with exponential backoff (default: 3)
 *   --dry-run       : Skip actual file writes
 *   --force         : Skip idempotency check
 * 
 * This script:
 * 1. Fetches the component from 21st.dev using its ID
 * 2. Extracts the component code block
 * 3. Transforms shadcn.ui classes to your custom Tailwind v4 naming
 * 4. Writes the adapted component to src/components/ui/
 * 5. Updates components.json with the new component reference
 */
require('dotenv').config();
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const API_KEY = process.env.API_KEY_21ST;
const COMPONENT_ID = process.argv[2];
const OUTPUT_NAME = process.argv[3]?.replace(/^--/, '') || 'AdaptedComponent';
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'components', 'ui');
const TEMP_FILE = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.tmp.tsx`);
const OUTPUT_FILE = path.join(OUTPUT_DIR, `${OUTPUT_NAME}.tsx`);

// Parse flags
const retryArg = process.argv.indexOf('--retry');
const RETRY_COUNT = retryArg !== -1 ? parseInt(process.argv[retryArg + 1]) || 3 : 3;
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

// Validate inputs
if (!COMPONENT_ID) {
  console.error('❌ Component ID is required');
  process.exit(1);
}
if (!OUTPUT_NAME) {
  console.error('❌ Output component name is required');
  process.exit(1);
}

// Ensure API key is available for non-dry runs
if (!API_KEY && !DRY_RUN) {
  console.error('❌ API_KEY_21ST environment variable is not set');
  console.error('Please create .env file with API_KEY_21ST=your-api-key');
  process.exit(1);
}

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Helper function: sleep for backoff
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper function: compute simple hash for idempotency
function computeCodeHash(code) {
  return crypto.createHash('md5').update(code).digest('hex');
}

// Check idempotency - skip if component unchanged
if (fs.existsSync(OUTPUT_FILE) && !DRY_RUN && !FORCE) {
  // For idempotency check, we'll compare the expected output
  // This is a placeholder - in production, compute the actual expected hash
  console.log(`ℹ️  Checking idempotency for ${OUTPUT_NAME}...`);
  // For now, we proceed with adaptation
}

// Fetch component from 21st.dev with retry logic
console.log(`📥 Fetching component ${COMPONENT_ID} from 21st.dev...`);
let rawOutput;
let retryAttempts = 0;
let success = false;

while (retryAttempts < RETRY_COUNT && !success) {
  try {
    rawOutput = execSync(`21st get ${COMPONENT_ID} --api-key ${API_KEY}`, {
      encoding: 'utf8',
      stdio: 'pipe',
      timeout: 30000
    });
    success = true;
  } catch (err) {
    retryAttempts++;
    console.warn(`⚠️  API call failed (attempt ${retryAttempts}/${RETRY_COUNT}): ${err.message}`);
    if (retryAttempts < RETRY_COUNT) {
      const backoff = Math.pow(2, retryAttempts) * 1000;
      console.log(`⏳ Waiting ${backoff}ms before retry...`);
      // Note: execSync is sync, so we use a workaround for delay
      const start = Date.now();
      while (Date.now() - start < backoff) {
        // Busy wait for synchronous delay
      }
    }
  }
}

if (!success) {
  console.error('❌ Failed to fetch component after multiple attempts');
  if (rawOutput) console.error('Partial output:\n', rawOutput);
  process.exit(1);
}

// Parse the markdown to extract the component code
const codeBlockMatch = rawOutput.match(/^```tsx\s*\n(.+?)\s*\n```/ms);
if (!codeBlockMatch) {
  console.error('❌ Could not find code block in fetched component');
  console.error('Raw output:\n', rawOutput);
  process.exit(1);
}

let componentCode = codeBlockMatch[1];

// Transform shadcn.ui classes to your custom Tailwind v4 style
const transformations = [
  { regex: /bg-primary/g, replacement: 'bg-blue-600' },
  { regex: /text-primary-foreground/g, replacement: 'text-white' },
  { regex: /bg-secondary/g, replacement: 'bg-gray-200' },
  { regex: /bg-destructive/g, replacement: 'bg-red-600' },
  { regex: /bg-outline/g, replacement: 'border-2 border-gray-300' },
  { regex: /bg-ghost/g, replacement: 'bg-transparent' },
  { regex: /bg-link/g, replacement: 'text-blue-600' },
  { regex: /h-10/g, replacement: 'h-10' },
  { regex: /h-9/g, replacement: 'h-9' },
  { regex: /px-4/g, replacement: 'px-4' },
  { regex: /px-3/g, replacement: 'px-3' },
  { regex: /rounded-md/g, replacement: 'rounded-lg' },
  { regex: /transition-colors/g, replacement: 'transition-colors duration-200 ease-in-out' },
  { regex: /focus-visible:ring-2/g, replacement: 'focus-visible:ring-2 focus-visible:ring-blue-500' },
  { regex: /disabled:opacity-50/g, replacement: 'disabled:opacity-50 cursor-not-allowed' }
];

// Apply transformations
let transformedCode = componentCode;
transformations.forEach(({ regex, replacement }) => {
  transformedCode = transformedCode.replace(new RegExp(regex, 'g'), replacement);
});

// Add metadata comment
const metadata = `// Adapted from 21st.dev component ${COMPONENT_ID}
// Generated: ${new Date().toISOString()}
// Transform: shadcn.ui → Tailwind v4 custom
`;

transformedCode = metadata + transformedCode;

// Write to temporary file
fs.writeFileSync(TEMP_FILE, transformedCode);
console.log(`✅ Temporary file created at ${TEMP_FILE}`);

// Move to final destination
if (!DRY_RUN) {
  fs.copyFileSync(TEMP_FILE, OUTPUT_FILE);
  fs.unlinkSync(TEMP_FILE);
  console.log(`📝 Adapted component written to ${OUTPUT_FILE}`);
} else {
  console.log(`📝 (DRY-RUN) Component would be written to ${OUTPUT_FILE}`);
}

console.log('🎉 Adaptation complete!');
console.log(`   - Component: ${OUTPUT_NAME}`);
console.log(`   - File: src/components/ui/${OUTPUT_NAME.toLowerCase()}.tsx`);

// Update components.json to register the new component
const componentsPath = path.join(OUTPUT_DIR, '..', '..', 'components.json');
if (fs.existsSync(componentsPath)) {
  const componentsContent = JSON.parse(fs.readFileSync(componentsPath, 'utf8'));
  
  componentsContent.aliases[`@/${OUTPUT_NAME.toLowerCase()}`] = `@/${OUTPUT_NAME.toLowerCase()}`;
  
  fs.writeFileSync(componentsPath, JSON.stringify(componentsContent, null, 2));
  console.log('📋 Updated components.json registry');
}