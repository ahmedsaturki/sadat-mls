import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";
import { checkApiRateLimit } from "@/lib/security/rateLimit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  if (request.method !== "GET") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Rate limiting to prevent DoS
  const rawIp = request.headers.get("x-forwarded-for") || "unknown";
  const ip = rawIp.split(",")[0].trim();
  const rate = await checkApiRateLimit(`health:${ip}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } });
  }

  // Simple connectivity check — no infrastructure details leaked
  let healthy = false;

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
      const { error } = await supabase.from("offices").select("id", { count: "exact", head: true }).limit(1);
      healthy = !error;
    }
  } catch {
    healthy = false;
  }

  if (!healthy) {
    logger.error("Health check failed");
  }

  // Minimal response — no version, no response time, no detailed checks
  return NextResponse.json(
    { status: healthy ? "ok" : "error" },
    { status: healthy ? 200 : 503 }
  );
}
