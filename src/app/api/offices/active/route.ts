import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { checkApiRateLimit } from "@/lib/security/rateLimit";

export const revalidate = 300; // ISR: 5 minutes

/**
 * Get active office IDs - cached at edge/network level.
 * Uses service role client to avoid cookies in SSG context.
 */
export async function GET(request: NextRequest) {
  try {
    const rawIp = request.headers.get("x-forwarded-for") || "unknown";
    const ip = rawIp.split(",")[0].trim();
    const rate = await checkApiRateLimit(`offices-active:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: offices, error } = await supabaseAdmin
      .from("offices")
      .select("id")
      .eq("is_active", true);

    if (error) {
      logger.error("Failed to fetch active offices", { error: error.message });
      return NextResponse.json({ ids: [] }, { status: 500 });
    }

    const ids = (offices as { id: string }[] | null)?.map((o) => o.id) || [];

    return NextResponse.json(
      { ids },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
        },
      }
    );
  } catch (err) {
    logger.error("Active offices API error", {
      error: err instanceof Error ? err.message : "Unknown",
    });
    return NextResponse.json({ ids: [] }, { status: 500 });
  }
}