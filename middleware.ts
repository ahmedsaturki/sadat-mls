import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const locales = ["ar", "en"];
const defaultLocale = "ar";

/** Routes that require authentication. */
const PROTECTED_PREFIXES = ["/admin", "/dashboard"];

/** API routes that require CSRF token seeding (authenticated state-changing endpoints). */
const PROTECTED_API_ROUTES = ["/api/agents", "/api/auth/resend-verification"];

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

function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  const nonce = generateNonce();

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "0");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
   response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), ambient-light-sensor=(), autoplay=(), encrypted-media=(), picture-in-picture=(), web-share=(), interest-cohort=(), accessibility-events=()");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload",
  );
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests",
    ].join("; "),
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip non-page routes – apply only security headers, no auth check.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icons") ||
    pathname.includes(".") ||
    pathname === "/sw.js" ||
    pathname === "/workbox-*.js" ||
    pathname === "/sitemap.xml" ||
    pathname === "/robots.txt" ||
    pathname === "/manifest.json"
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 2. Skip Vercel internal paths (e.g., /<hash>/vitals for analytics)
  //    NextResponse.next() would route to the Next.js serverless function which
  //    doesn't handle this path. Return an empty 200 so the browser doesn't log
  //    a "Fetch failed loading" error for the analytics POST.
  if (/^\/[a-f0-9]{16}\/vitals$/.test(pathname)) {
    return new NextResponse(null, { status: 200 });
  }

  // 3. Create Supabase client for session validation
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

// 3. Check if protected route
   if (needsAuth(pathname)) {
     const { data: { user } } = await supabase.auth.getUser();

     if (!user) {
       // Redirect to login with next parameter and locale
       const locale = getLocale(request);
       const loginUrl = new URL(`/${locale}/login`, request.url);
       loginUrl.searchParams.set("next", pathname);
       return applySecurityHeaders(NextResponse.redirect(loginUrl));
     }

     // Seed CSRF token for authenticated users on protected routes
     // This ensures the double-submit cookie pattern works for state-changing API calls
     const existingCsrf = request.cookies.get("csrf_token");
     if (!existingCsrf?.value) {
       // Generate CSRF token using edge runtime crypto (available globally in middleware)
       const randomValue = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 38);
       const token = `${Date.now()}.${randomValue}`;
       const response = NextResponse.next();
       response.cookies.set("csrf_token", token, {
         httpOnly: false,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 60 * 60 * 24,
         path: "/",
       });
       return applySecurityHeaders(response);
     }
   } else {
     // For non-auth routes, still seed CSRF for protected API paths when they have locale prefixes
     // This catches /ar/api/agents, /en/api/agents, etc.
     const pathPart = pathname.startsWith("/") ? pathname : `/${pathname}`;
     const matchesProtectedAPI = PROTECTED_API_ROUTES.some(route => 
       pathPart === `/${route}` || 
       (pathname.startsWith("/ar/") && pathPart === `/ar/${route}`) || 
       (pathname.startsWith("/en/") && pathPart === `/en/${route}`) ||
       pathPart.startsWith(`${route}/`) ||
       (pathname.startsWith("/ar/") && pathPart.startsWith(`/ar/${route}/`)) ||
       (pathname.startsWith("/en/") && pathPart.startsWith(`/en/${route}/`))
     );
     
     if (matchesProtectedAPI) {
       // Generate CSRF token using edge runtime crypto (available globally in middleware)
       const randomValue = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 38);
       const token = `${Date.now()}.${randomValue}`;
       const response = NextResponse.next();
       response.cookies.set("csrf_token", token, {
         httpOnly: false,
         secure: process.env.NODE_ENV === "production",
         sameSite: "lax",
         maxAge: 60 * 60 * 24,
         path: "/",
       });
       return applySecurityHeaders(response);
     }
   }

  // 4. Skip RSC prefetch requests after auth check – let Next.js handle them natively
  if (request.nextUrl.searchParams.has("_rsc")) {
    return applySecurityHeaders(NextResponse.next());
  }

  // 5. Locale handling
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  );

  if (!pathnameHasLocale) {
    const locale = getLocale(request);
    const normalizedPathname = pathname === "/" ? "" : pathname;
    const newUrl = new URL(`/${locale}${normalizedPathname}`, request.url);
    return applySecurityHeaders(NextResponse.redirect(newUrl));
  }

  // 5. Apply security headers for all other routes
  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next|favicon.ico|manifest.json|sw.js|workbox-*.js|icons/).*)"],
};