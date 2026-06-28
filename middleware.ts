import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["ar", "en"];
const defaultLocale = "ar";

/* -------------------------------------------------------------------------- */
/*  Route helpers                                                              */
/* -------------------------------------------------------------------------- */

/** Routes that require authentication. */
const PROTECTED_PREFIXES = ["/admin", "/dashboard"];

function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === `/${prefix}` ||
      pathname.startsWith(`/${prefix}/`) ||
      // Match locale-prefixed variants: /ar/admin, /en/dashboard, etc.
      locales.some(
        (locale) =>
          pathname === `/${locale}${prefix}` ||
          pathname.startsWith(`/${locale}${prefix}/`),
      ),
  );
}

/**
 * Check for a Supabase auth token cookie.  Supabase names these with the
 * pattern `sb-<project-ref>-auth-token`.
 */
function hasSupabaseAuthToken(request: NextRequest): boolean {
  const cookies = request.cookies;
  for (const [, cookie] of cookies) {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      return true;
    }
  }
  return false;
}

/* -------------------------------------------------------------------------- */
/*  Locale helpers                                                             */
/* -------------------------------------------------------------------------- */

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function getLocale(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language");
  if (acceptLanguage) {
    const preferred = acceptLanguage.split(",")[0].split("-")[0];
    if (locales.includes(preferred)) {
      return preferred;
    }
  }
  return defaultLocale;
}

/* -------------------------------------------------------------------------- */
/*  Middleware entry point                                                     */
/* -------------------------------------------------------------------------- */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // -----------------------------------------------------------------------
  // 1. Skip non-page routes – apply only security headers, no auth check.
  // -----------------------------------------------------------------------
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".") ||
    pathname === "/sw.js" ||
    pathname === "/workbox-*.js" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json"
  ) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // -----------------------------------------------------------------------
  // 2. Auth guard for protected routes.
  // -----------------------------------------------------------------------
  if (needsAuth(pathname) && !hasSupabaseAuthToken(request)) {
    // Determine the locale prefix so the redirect lands on the login page
    // in the correct language.
    const locale = getLocale(request);
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("next", pathname);
    const response = NextResponse.redirect(loginUrl);
    applySecurityHeaders(response);
    return response;
  }

  // -----------------------------------------------------------------------
  // 3. Locale handling.
  // -----------------------------------------------------------------------
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (pathnameHasLocale) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  const locale = getLocale(request);
  const normalizedPathname = pathname === "/" ? "" : pathname;
  const newUrl = new URL(`/${locale}${normalizedPathname}`, request.url);
  const response = NextResponse.redirect(newUrl);
  applySecurityHeaders(response);
  return response;
}

/* -------------------------------------------------------------------------- */
/*  Security headers                                                          */
/* -------------------------------------------------------------------------- */

function applySecurityHeaders(response: NextResponse) {
  const nonce = generateNonce();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("X-Nonce", nonce);
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|manifest.json|sw.js|workbox-*.js|icons/).*)"],
};
