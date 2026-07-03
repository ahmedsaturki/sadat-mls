import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_LOCALES = ["ar", "en"];

/**
 * Build a whitelist of redirect hosts from the environment variable
 * `NEXT_PUBLIC_APP_URL`.  Falls back to the request `origin` if the env var
 * is not set, and always includes `"localhost"` for development.
 */
function getAllowedHosts(origin: string): Set<string> {
  const hosts = new Set<string>();

  // Always allow localhost in development.
  hosts.add("localhost");
  hosts.add("127.0.0.1");

  // Parse the environment variable (comma-separated).
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) {
    try {
      hosts.add(new URL(envUrl).hostname);
    } catch {
      // If it's not a full URL, treat it as a bare hostname.
      hosts.add(envUrl.replace(/^https?:\/\//, "").split("/")[0]);
    }
  }

  // Also allow the current origin so same-origin redirects always work.
  if (origin) {
    try {
      hosts.add(new URL(origin).hostname);
    } catch {
      // ignore
    }
  }

  return hosts;
}

/**
 * Validate that a hostname is in the allowed list.  Returns `true` when the
 * host is safe to redirect to.
 */
function isHostAllowed(hostname: string, allowedHosts: Set<string>): boolean {
  if (allowedHosts.has(hostname)) return true;

  // Allow only the project's own Vercel preview deploys (e.g. sadat-mls-*.vercel.app).
  // Extract the project prefix from the production URL.
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  try {
    const productionHost = new URL(envUrl).hostname;
    // e.g. "sadat-mls.vercel.app" → prefix "sadat-mls"
    const prefix = productionHost.split(".vercel.app")[0];
    if (prefix && hostname === `${prefix}.vercel.app`) return true;
    // Preview deploys append a hash: sadat-mls-abc123xyz.vercel.app
    if (prefix && hostname.startsWith(`${prefix}-`) && hostname.endsWith(".vercel.app")) return true;
  } catch {
    // ignore
  }

  return false;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const locale = searchParams.get("locale") ?? "ar";
  const type = searchParams.get("type");

  const safeLocale = ALLOWED_LOCALES.includes(locale) ? locale : "ar";

  const safeNext = next.startsWith("/") && !next.startsWith("//") && !next.includes("://")
    ? next
    : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";

      const allowedHosts = getAllowedHosts(origin);

      // For recovery links, always redirect to reset-password page
      const redirectPath = type === "recovery" ? "/reset-password" : safeNext;

      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}/${safeLocale}${redirectPath}`;
      } else if (forwardedHost) {
        if (!isHostAllowed(forwardedHost, allowedHosts)) {
          redirectUrl = `${origin}/${safeLocale}${redirectPath}`;
        } else {
          redirectUrl = `https://${forwardedHost}/${safeLocale}${redirectPath}`;
        }
      } else {
        redirectUrl = `${origin}/${safeLocale}${redirectPath}`;
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/${safeLocale}/reset-password`);
  }

  return NextResponse.redirect(`${origin}/${safeLocale}/login?error=auth_failed`);
}
