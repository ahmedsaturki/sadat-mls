import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

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

  // Health checks must measure application dependencies directly.
  // They intentionally bypass application request rate limiting so an operational
  // database outage is not confused with a rate-limit subsystem outage.
  // Perform health checks
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
