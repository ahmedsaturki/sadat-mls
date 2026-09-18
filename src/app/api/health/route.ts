import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

const HEALTH_RATE_LIMIT_MAX = 100;
const HEALTH_RATE_LIMIT_WINDOW_MS = 60_000;
const healthRateLimitStore = new Map<string, { windowStart: number; count: number }>();

interface HealthCheckResult {
  status: "ok" | "error";
  timestamp: string;
  checks: {
    supabase: "ok" | "error";
  };
}

export async function GET(request: NextRequest): Promise<NextResponse<HealthCheckResult | { error: string }>> {
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const rawIp =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const existing = healthRateLimitStore.get(rawIp);
  const windowStart =
    existing && now - existing.windowStart < HEALTH_RATE_LIMIT_WINDOW_MS
      ? existing.windowStart
      : now;
  const count =
    existing && windowStart === existing.windowStart ? existing.count + 1 : 1;
  healthRateLimitStore.set(rawIp, { windowStart, count });

  if (healthRateLimitStore.size > 1000) {
    for (const [key, value] of healthRateLimitStore) {
      if (now - value.windowStart >= HEALTH_RATE_LIMIT_WINDOW_MS) {
        healthRateLimitStore.delete(key);
      }
    }
  }

  const resetTime = windowStart + HEALTH_RATE_LIMIT_WINDOW_MS;
  const remaining = Math.max(0, HEALTH_RATE_LIMIT_MAX - count);
  const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
  const rateLimitHeaders = {
    "X-RateLimit-Limit": String(HEALTH_RATE_LIMIT_MAX),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
    "Retry-After": String(retryAfter),
  };

  if (count > HEALTH_RATE_LIMIT_MAX) {
    return NextResponse.json(
      { error: "Too many requests", status: "error" },
      { status: 429, headers: rateLimitHeaders },
    );
  }

  const checks: HealthCheckResult["checks"] = { supabase: "error" };
  let healthy = false;

  try {
    const supabase = createServiceRoleClient();
      const { error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .limit(1)
        .abortSignal(AbortSignal.timeout(3000)); // 3-second timeout
      
      checks.supabase = error ? "error" : "ok";
      healthy = !error;
  } catch (error: unknown) {
    checks.supabase = "error";
    logger.error("Health check failed", error instanceof Error ? { message: error.message, stack: error.stack } : { error: String(error) });
  }

  const result: HealthCheckResult = {
    status: healthy ? "ok" : "error",
    timestamp: new Date().toISOString(),
    checks,
  };

  return NextResponse.json(result, {
    status: healthy ? 200 : 503,
    headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
  });
}
