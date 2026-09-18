import { execFileSync } from "node:child_process";

const projectRef = process.env.SUPABASE_PROJECT_ID;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN;

if (!projectRef || !accessToken) {
  console.error("Missing Supabase project configuration for API-key resolution.");
  process.exit(1);
}

let raw;
try {
  raw = execFileSync(
    "supabase",
    ["projects", "api-keys", "--project-ref", projectRef, "--output", "json"],
    {
      encoding: "utf8",
      env: { ...process.env, SUPABASE_ACCESS_TOKEN: accessToken },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
} catch (error) {
  const details =
    error && typeof error === "object" && "stderr" in error
      ? String(error.stderr ?? "").trim()
      : "";
  console.error(details || "Failed to retrieve Supabase project API keys.");
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("Supabase API-key response was not valid JSON.");
  process.exit(1);
}

const list = Array.isArray(parsed)
  ? parsed
  : parsed && typeof parsed === "object" && Array.isArray(parsed.api_keys)
    ? parsed.api_keys
    : [];

const modernSecret = list.find(
  (entry) =>
    entry &&
    typeof entry === "object" &&
    entry.type === "secret" &&
    typeof entry.api_key === "string" &&
    entry.api_key.startsWith("sb_secret_"),
);

const legacyServiceRole = list.find(
  (entry) =>
    entry &&
    typeof entry === "object" &&
    typeof entry.api_key === "string" &&
    entry.api_key.startsWith("eyJ") &&
    (entry.id === "service_role" || entry.name === "service_role"),
);

const key = modernSecret?.api_key ?? legacyServiceRole?.api_key ?? "";

if (!/^sb_secret_|^eyJ/.test(key)) {
  console.error("No supported Supabase privileged API key was found.");
  process.exit(1);
}

process.stdout.write(key);
