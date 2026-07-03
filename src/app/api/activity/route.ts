import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

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
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

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
    const { action, entity_type, entity_id, entity_title, metadata } = body;

    if (!action || !entity_type) {
      return NextResponse.json({ error: "action and entity_type are required" }, { status: 400 });
    }

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
