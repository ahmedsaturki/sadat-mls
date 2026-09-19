import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const outputPath = resolve(root, "src/lib/supabase/types.ts");
const npxBin = process.platform === "win32" ? "npx.cmd" : "npx";

let generated;
try {
  generated = execFileSync(
    npxBin,
    ["--no-install", "supabase", "gen", "types", "typescript", "--local"],
    {
      cwd: root,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
} catch (error) {
  const stderr = error?.stderr?.toString().trim();
  if (stderr) process.stderr.write(stderr + "\n");
  process.stderr.write(
    "Local Supabase type generation failed. Start the local Supabase stack and retry. Remote fallback is intentionally disabled.\n",
  );
  process.exit(1);
}

const text = generated.trimEnd() + "\n";
if (
  text.length < 100 ||
  !text.includes("export type Database =") ||
  !text.includes("__InternalSupabase")
) {
  process.stderr.write(
    "Generated Supabase types are missing the expected Database contract; refusing to write them.\n",
  );
  process.exit(1);
}

const checkOnly = process.argv.includes("--check");
if (checkOnly) {
  if (!existsSync(outputPath)) {
    process.stderr.write(`Missing checked-in types file: ${outputPath}\n`);
    process.exit(1);
  }
  const existing = readFileSync(outputPath, "utf8");
  if (existing !== text) {
    process.stderr.write(
      "Checked-in Supabase types differ from the local generated contract.\n",
    );
    process.exit(1);
  }
  process.stdout.write("SUPABASE_TYPES_MATCH\n");
  process.exit(0);
}

writeFileSync(outputPath, text, "utf8");
process.stdout.write(`Wrote ${outputPath}\n`);
