import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

// DELETE - Clean up old notifications (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`notifications-cleanup:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is super admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get("days") || "90");
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Delete notifications older than specified days
    const { error } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", cutoffDate.toISOString());

    if (error) {
      logger.error("Failed to cleanup notifications", { error: error.message });
      return NextResponse.json({ error: "Failed to cleanup notifications" }, { status: 500 });
    }

    logger.info("Notifications cleaned up", { days, deletedBy: user.id });
    return NextResponse.json({
      success: true,
      message: `Deleted notifications older than ${days} days`,
    });
  } catch (err) {
    logger.error("Notification cleanup error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
