import { NextRequest, NextResponse } from "next/server";
import { checkAuthRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

const LOGIN_RATE_LIMIT = {
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
};

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  const rate = await checkAuthRateLimit(`login:${ip}`, LOGIN_RATE_LIMIT);

  if (rate.unavailable) {
    logger.error("Login rate limiting unavailable", { ip });
    return NextResponse.json(
      { error: "Rate limiting temporarily unavailable", retryAfter: rate.retryAfter },
      { status: 503, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } },
    );
  }

  if (!rate.allowed) {
    logger.warn("Login rate limit exceeded", { ip });
    return NextResponse.json(
      {
        error: "Too many login attempts",
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

  return NextResponse.json({
    allowed: true,
    remaining: rate.remaining,
    retryAfter: 0,
  });
}
