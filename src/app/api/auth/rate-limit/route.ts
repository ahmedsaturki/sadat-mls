import { NextRequest, NextResponse } from "next/server";
import { checkAuthRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();

  const rate = await checkAuthRateLimit(`login:${ip}`);

  if (!rate.allowed) {
    logger.warn("Login rate limit exceeded", { ip });
    return NextResponse.json(
      { 
        error: "Too many login attempts",
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

  return NextResponse.json({
    allowed: true,
    remaining: rate.remaining,
    retryAfter: 0
  });
}