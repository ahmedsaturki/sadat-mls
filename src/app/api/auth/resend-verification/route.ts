import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { checkAuthRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const csrfValid = await validateCsrfToken(request);
  if (!csrfValid) {
    logger.warn("Resend verification CSRF validation failed");
    return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
  }

  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();

  const rate = await checkAuthRateLimit(`resend:${ip}`);

  if (!rate.allowed) {
    logger.warn("Resend verification rate limit exceeded", { ip });
    return NextResponse.json(
      { 
        error: "Too many resend requests",
        retryAfter: rate.retryAfter,
        locked: true
      },
      { 
        status: 429, 
        headers: rate.headers || {
          "Retry-After": String(rate.retryAfter),
          "X-RateLimit-Remaining": String(rate.remaining),
          "X-RateLimit-Reset": String(Math.ceil(Date.now() / 1000) + rate.retryAfter)
        }
      }
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
        },
      },
    }
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const { error } = await supabase.auth.resend({ type: "signup", email, options: { emailRedirectTo: `${appUrl}/auth/callback` } });

  if (error) {
    logger.warn("Resend verification failed", { error: error.message, email });
    return NextResponse.json({ error: "Failed to resend verification email" }, { status: 400 });
  }

  return NextResponse.json({ 
    success: true, 
    message: "Verification email sent",
    remaining: rate.remaining
  });
}