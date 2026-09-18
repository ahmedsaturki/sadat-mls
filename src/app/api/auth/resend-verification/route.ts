import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkAuthRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/public-config";

const RESEND_VERIFICATION_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 5,
};

function getPublicSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://sadat-mls.vercel.app"
  ).replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    logger.warn("Resend verification CSRF validation failed");
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkAuthRateLimit(`resend:${ip}`, RESEND_VERIFICATION_RATE_LIMIT);

  if (rate.unavailable) {
    logger.error("Resend verification rate limiting unavailable", { ip });
    return NextResponse.json(
      { error: "Rate limiting temporarily unavailable", retryAfter: rate.retryAfter },
      { status: 503, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } },
    );
  }

  if (!rate.allowed) {
    logger.warn("Resend verification rate limit exceeded", { ip });
    return NextResponse.json(
      {
        error: "Too many resend requests",
        retryAfter: rate.retryAfter,
        locked: true,
      },
      {
        status: 429,
        headers: rate.headers || {
          "Retry-After": String(rate.retryAfter),
          "X-RateLimit-Remaining": String(rate.remaining),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + rate.retryAfter),
        },
      },
    );
  }

  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email } = body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
    options: { emailRedirectTo: `${getPublicSiteUrl()}/auth/callback` },
  });

  if (error) {
    logger.warn("Resend verification failed", { error: error.message });
    return NextResponse.json({ error: "Failed to resend verification email" }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "Verification email sent",
    remaining: rate.remaining,
  });
}
