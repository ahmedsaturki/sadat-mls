import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { z } from "zod";

export async function GET(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`activity-get:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get("limit") || "20";
    const offsetParam = searchParams.get("offset") || "0";
    const limit = Math.min(Math.max(parseInt(limitParam) || 10, 1), 100);
    const offset = Math.max(parseInt(offsetParam) || 0, 0);

    const { data: activities, error } = await supabase
      .from("activity_log")
      .select("id, action, entity_type, entity_id, entity_title, metadata, created_at, users!activity_log_user_id_fkey(full_name, email)")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.error("Failed to fetch activity log", { error: error.message });
      return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
    }

    return NextResponse.json({ activities: activities || [] });
  } catch (err) {
    logger.error("Activity log API error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = await checkApiRateLimit(`activity-post:${ip}`);
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // CSRF validation
    const isValidCsrf = await validateCsrfToken(request);
    if (!isValidCsrf) {
      logger.warn("Invalid CSRF token on activity POST", { ip });
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch user's office_id from DB instead of trusting request body
    const { data: userProfile } = await supabase
      .from("users")
      .select("office_id")
      .eq("id", user.id)
      .single();

    const body = await request.json();

    const activitySchema = z.object({
      action: z.string().min(1).max(100),
      entity_type: z.string().min(1).max(50),
      entity_id: z.string().uuid().optional(),
      entity_title: z.string().max(255).optional(),
      metadata: z.record(z.unknown()).optional(),
    });

    const parsed = activitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const { action, entity_type, entity_id, entity_title, metadata } = parsed.data;

    const { error } = await supabase
      .from("activity_log")
      .insert({
        user_id: user.id,
        office_id: userProfile?.office_id || null,
        action,
        entity_type,
        entity_id: entity_id || null,
        entity_title: entity_title || null,
        metadata: metadata || {},
        ip_address: ip,
      });

    if (error) {
      logger.error("Failed to insert activity log", { error: error.message });
      return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Activity log insert error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
