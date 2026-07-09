import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createNotificationSchema = z.object({
  type: z.string().min(1).max(50),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  entity_type: z.string().max(50).optional().nullable(),
  entity_id: z.string().uuid().optional().nullable(),
});

const patchNotificationSchema = z.object({
  ids: z.array(z.string().uuid()).optional(),
  markAll: z.boolean().optional(),
}).refine(
  (data) => data.markAll === true || (data.ids && data.ids.length > 0),
  { message: "Provide ids array or markAll: true" }
);

// GET - List notifications for current user
export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`notifications-get:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unread") === "true";

    let query = supabase
      .from("notifications")
      .select("id, type, title, message, title_params, message_params, entity_type, entity_id, is_read, created_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      logger.error("Failed to fetch notifications", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (err) {
    logger.error("Notifications API error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create a notification (system/admin only — uses authenticated user's ID)
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`notifications-post:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // CSRF validation
    const isValidCsrf = await validateCsrfToken(request);
    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token on notifications POST", { ip });
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = createNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { type, title, message, entity_type, entity_id } = parsed.data;

    // Always use authenticated user's ID — never accept user_id from body
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: user.id,
        office_id: null,
        type,
        title,
        message,
        entity_type: entity_type || null,
        entity_id: entity_id || null,
      });

    if (error) {
      logger.error("Failed to create notification", { error: error.message });
      return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Notification create error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`notifications-patch:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // CSRF validation
    const isValidCsrf = await validateCsrfToken(request);
    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token on notifications PATCH", { ip });
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = patchNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { ids, markAll } = parsed.data;

    let query = supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    if (markAll) {
      // Mark all as read
      query = query.eq("is_read", false);
    } else if (ids && ids.length > 0) {
      // Mark specific notifications as read
      query = query.in("id", ids);
    } else {
      return NextResponse.json(
        { error: "Provide ids array or markAll: true" },
        { status: 400 }
      );
    }

    const { error } = await query;

    if (error) {
      logger.error("Failed to update notifications", { error: error.message });
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Notification update error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
