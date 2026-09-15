import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { checkApiRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

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

  // Rate limiting to prevent DoS
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`health:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests", status: "error", timestamp: new Date().toISOString(), checks: { supabase: "error" } },
      { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } }
    );
  }

  // Perform health checks
  const checks: HealthCheckResult["checks"] = { supabase: "error" };
  let healthy = false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
      const { error } = await supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .limit(1)
        .abortSignal(AbortSignal.timeout(3000)); // 3-second timeout
      
      checks.supabase = error ? "error" : "ok";
      healthy = !error;
    } else {
      checks.supabase = "error";
      logger.warn("Health check: Supabase credentials not configured");
    }
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
