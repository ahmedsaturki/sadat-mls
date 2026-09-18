import { NextRequest, NextResponse } from "next/server";
import { checkAuthRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

const FORGOT_PASSWORD_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
};

export async function POST(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();

  const rate = await checkAuthRateLimit(`forgot:${ip}`, FORGOT_PASSWORD_RATE_LIMIT);

  if (rate.unavailable) {
    logger.error("Forgot password rate limiting unavailable", { ip });
    return NextResponse.json(
      { error: "Rate limiting temporarily unavailable", retryAfter: rate.retryAfter },
      { status: 503, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } },
    );
  }

  if (!rate.allowed) {
    logger.warn("Forgot password rate limit exceeded", { ip });
    return NextResponse.json(
      {
        error: "Too many password reset requests",
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
      }
    );
  }

  return NextResponse.json({
    allowed: true,
    remaining: rate.remaining,
    retryAfter: 0,
  });
}
