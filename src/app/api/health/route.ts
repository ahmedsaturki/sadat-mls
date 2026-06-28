import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  const startTime = Date.now();
  const checks: Record<string, { status: "ok" | "error"; responseTime?: number; message?: string }> = {};

  // Check Supabase connectivity using admin client (no cookies needed)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      checks.supabase = {
        status: "error",
        message: "Supabase environment variables not configured",
      };
    } else {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from("offices").select("id", { count: "exact", head: true }).limit(1);
      checks.supabase = {
        status: error ? "error" : "ok",
        responseTime: Date.now() - startTime,
        message: error ? error.message : undefined,
      };
    }
  } catch (err) {
    checks.supabase = {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }

  const allHealthy = Object.values(checks).every((c) => c.status === "ok");
  const totalResponseTime = Date.now() - startTime;

  const responseBody = {
    status: allHealthy ? "healthy" : "unhealthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "0.1.0",
    checks,
    responseTime: `${totalResponseTime}ms`,
  };

  if (!allHealthy) {
    logger.error("Health check failed", { checks });
  }

  return NextResponse.json(responseBody, { status: allHealthy ? 200 : 503 });
}
