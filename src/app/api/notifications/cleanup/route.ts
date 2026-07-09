import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { ROLES } from "@/lib/utils/constants";
import { z } from "zod";

const cleanupSchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(90),
});

// DELETE - Clean up old notifications (super admin only)
export async function DELETE(request: NextRequest) {
  try {
    const rawIp = request.headers.get("x-forwarded-for") || "unknown";
    const ip = rawIp.split(",")[0].trim();
    const rate = await checkApiRateLimit(`notifications-cleanup:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: rate.headers || { "Retry-After": String(rate.retryAfter) } }
      );
    }

    // CSRF validation for destructive operation
    const isValidCsrf = await validateCsrfToken(request);
    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token on notifications cleanup DELETE", { ip });
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
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

    if (profile?.role !== ROLES.SUPER_ADMIN) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const parsed = cleanupSchema.safeParse({
      days: searchParams.get("days") || "90",
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid parameters", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { days } = parsed.data;
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
      i18nKey: "deletedOldNotifications",
      i18nParams: { days },
      message: `Deleted notifications older than ${days} days`,
    });
  } catch (err) {
    logger.error("Notification cleanup error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
