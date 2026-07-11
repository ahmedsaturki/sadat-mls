import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint for rate limit cleanup.
 * Call this periodically (e.g., daily via Vercel Cron or external scheduler).
 *
 * Rate limits:
 * - rate_limit_state: In-memory L1 + PostgreSQL L2 (atomic upsert)
 * - rate_limit_log: Audit log (legacy)
 *
 * This endpoint cleans up old rows from both tables.
 *
 * To set up Vercel Cron, add to vercel.json:
 * { "crons": [{ "path": "/api/cron/cleanup", "schedule": "0 3 * * *" }] }
 *
 * Or call manually: GET /api/cron/cleanup
 * Secure with CRON_SECRET env var for production.
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // 1. Clean up rate_limit_state (old rows beyond 24h)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: stateCount, error: stateError } = await supabase
      .from("rate_limit_state")
      .delete()
      .lt("window_start", twentyFourHoursAgo);

    if (stateError) {
      logger.error("Failed to cleanup rate_limit_state", { error: stateError.message });
    }

    // 2. Clean up rate_limit_log (old rows beyond 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: logCount, error: logError } = await supabase
      .from("rate_limit_log")
      .delete()
      .lt("created_at", sevenDaysAgo);

    if (logError) {
      logger.error("Failed to cleanup rate_limit_log", { error: logError.message });
    }

    // 3. Clean up old activity_log (beyond 90 days)
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { count: activityCount, error: activityError } = await supabase
      .from("activity_log")
      .delete()
      .lt("created_at", ninetyDaysAgo);

    if (activityError) {
      logger.error("Failed to cleanup activity_log", { error: activityError.message });
    }

    // 4. Clean up old notifications (beyond 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { count: notifCount, error: notifError } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", thirtyDaysAgo)
      .eq("is_read", true);

    if (notifError) {
      logger.error("Failed to cleanup notifications", { error: notifError.message });
    }

    logger.info("Cron cleanup completed", {
      rateLimitState: stateCount || 0,
      rateLimitLog: logCount || 0,
      activityLog: activityCount || 0,
      notifications: notifCount || 0,
    });

    return NextResponse.json({
      success: true,
      cleaned: {
        rateLimitState: stateCount || 0,
        rateLimitLog: logCount || 0,
        activityLog: activityCount || 0,
        notifications: notifCount || 0,
      },
    });
  } catch (err) {
    logger.error("Cron cleanup error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
