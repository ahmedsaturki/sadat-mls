import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

/** All locales supported by Sadat MLS */
const locales = ["ar", "en"];
const defaultLocale = "ar";

/** Routes that require authentication (protected paths) */
const PROTECTED_PREFIXES = ["/admin", "/dashboard"];

/** Allows both partial matches and exact matches for route protection */
function needsAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) =>
      pathname === `/${prefix}` ||
      pathname.startsWith(`/${prefix}/`) ||
      locales.some(
        (locale) =>
          pathname === `/${locale}${prefix}` ||
          pathname.startsWith(`/${locale}${prefix}/`),
      ),
  );
}

/** Determine locale from request or fallback to Arabic */
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

/** Generate cryptographically secure nonce for CSP */
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/** Create Content Security Policy headers with nonce */
function createContentSecurityPolicy(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
    "report-uri /api/csp-report",
    "report-to sentry",
  ].join("; ");
}

/** Apply all security headers including CSP */
function applySecurityHeaders(response: NextResponse): NextResponse {
  const nonce = generateNonce();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-DNS-Prefetch-Control", "off");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  response.headers.set("Content-Security-Policy", createContentSecurityPolicy(nonce));
  response.headers.set("x-nonce", nonce);

  return response;
}

/** Read existing CSRF token and check if it's still valid (24h) */
function csrfTokenValid(token: string | undefined): boolean {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      const timestamp = parseInt(parts[0], 10);
      if (!isNaN(timestamp) && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return true;
      }
    }
  } catch {
    // If parsing fails, generate new token
  }
  return false;
}

/** Seed CSRF token for API calls and authenticated users by mutating the response */
function seedCsrfToken(response: NextResponse, existingToken: string | undefined) {
  if (csrfTokenValid(existingToken)) {
    return;
  }

  // Generate cryptographically secure CSRF token with timestamp prefix
  const timestamp = Date.now();
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("");
  const token = `${timestamp}.${randomPart}`;

  response.cookies.set("csrf_token", token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  // Token is in the cookie (httpOnly: false) — client reads it directly.
  // No need to set x-csrf-token header on every response (leaks token).
}

/** Build a base page response and seed a valid CSRF token if needed */
function buildPageResponse(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  const existingCsrf = request.cookies.get("csrf_token")?.value;
  seedCsrfToken(response, existingCsrf);
  return response;
}

/** Middleware with comprehensive auth, CSRF, rate limiting, and locale support */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip non-page routes - apply only security headers
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".") ||
    pathname === "/sw.js" ||
    pathname.startsWith("/workbox-") ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json"
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Skip Vercel internal analytics endpoints
  if (/^\/[a-f0-9]{16}\/vitals$/.test(pathname)) {
    return new NextResponse(null, { status: 200 });
  }

  // API routes: apply security headers only — they handle their own auth
  if (pathname.startsWith("/api")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // Single page response we'll mutate and return; CSRF token is seeded once.
  const response = buildPageResponse(request);

  // Create Supabase server client for auth validation (page routes only)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, ...options }) => {
            request.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  // Authentication requirement check
  if (needsAuth(pathname)) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const locale = getLocale(request);
      const loginUrl = new URL(`/${locale}/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      const redirectResponse = NextResponse.redirect(loginUrl);
      seedCsrfToken(redirectResponse, request.cookies.get("csrf_token")?.value);
      return applySecurityHeaders(redirectResponse);
    }
  }

  // Skip RSC prefetch requests
  if (request.nextUrl.searchParams.has("_rsc")) {
    return applySecurityHeaders(response);
  }

  // Locale handling for non-API routes
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    const normalizedPathname = pathname === "/" ? "" : pathname;
    const newUrl = new URL(`/${locale}${normalizedPathname}`, request.url);
    const redirectResponse = NextResponse.redirect(newUrl);
    seedCsrfToken(redirectResponse, request.cookies.get("csrf_token")?.value);
    return applySecurityHeaders(redirectResponse);
  }

  // Extract locale from URL path and set as header for root layout
  const urlLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );
  if (urlLocale) {
    response.headers.set("x-locale", urlLocale);
  }

  return applySecurityHeaders(response);
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|manifest.json|sw.js|workbox-*.js|icons/).*)"],
};
