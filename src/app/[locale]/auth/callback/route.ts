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

  // Allow any *.vercel.app / *.vercel.app subdomains (preview deploys).
  if (hostname.endsWith(".vercel.app")) return true;

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

      let redirectUrl: string;
      if (isLocalEnv) {
        redirectUrl = `${origin}/${safeLocale}${safeNext}`;
      } else if (forwardedHost) {
        // Validate the forwarded host against our whitelist.
        if (!isHostAllowed(forwardedHost, allowedHosts)) {
          // Reject the untrusted host – fall back to the safe origin.
          redirectUrl = `${origin}/${safeLocale}${safeNext}`;
        } else {
          redirectUrl = `https://${forwardedHost}/${safeLocale}${safeNext}`;
        }
      } else {
        redirectUrl = `${origin}/${safeLocale}${safeNext}`;
      }

      return NextResponse.redirect(redirectUrl);
    }
  }

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/${safeLocale}/reset-password`);
  }

  return NextResponse.redirect(`${origin}/${safeLocale}/login?error=auth_failed`);
}
