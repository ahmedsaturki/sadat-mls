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
    supabase_api: "ok" | "error";
    properties: "ok" | "error";
  };
}

function describeError(error: unknown) {
  if (!(error instanceof Error)) return { value: String(error) };
  const cause = error.cause;
  return {
    name: error.name,
    message: error.message,
    cause:
      cause && typeof cause === "object"
        ? Object.fromEntries(
            Object.entries(cause as Record<string, unknown>).filter(([key]) =>
              ["code", "errno", "syscall", "address", "port", "message"].includes(key),
            ),
          )
        : cause
          ? String(cause)
          : undefined,
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

  const checks: HealthCheckResult["checks"] = { supabase_api: "error", properties: "error" };
  let healthy = false;

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY;

  if (supabaseUrl && publishableKey) {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { apikey: publishableKey },
        cache: "no-store",
        signal: AbortSignal.timeout(3000),
      });
      checks.supabase_api = response.ok ? "ok" : "error";
      if (!response.ok) {
        logger.error("Supabase API health probe returned non-2xx", {
          status: response.status,
          statusText: response.statusText,
        });
      }
    } catch (error: unknown) {
      logger.error("Supabase API health probe failed", describeError(error));
    }
  } else {
    logger.error("Supabase API health probe skipped: public configuration missing");
  }

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("properties")
      .select("id", { count: "exact", head: true })
      .limit(1)
      .abortSignal(AbortSignal.timeout(3000));

    checks.properties = error ? "error" : "ok";
    if (error) {
      logger.error("Supabase properties probe failed", {
        name: error.name,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
    }
  } catch (error: unknown) {
    logger.error("Health check failed", describeError(error));
  }

  healthy = checks.supabase_api === "ok" && checks.properties === "ok";

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
