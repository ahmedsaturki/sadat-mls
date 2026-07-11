import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

// GET - Fetch analytics for a specific property
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`analytics-property-get:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const supabase = createServiceRoleClient();

    // Get property info
    const { data: property } = await supabase
      .from("properties")
      .select("office_id")
      .eq("id", id)
      .maybeSingle();

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Get analytics counts by event type
    const [viewsRes, inquiriesRes, favoritesRes, sharesRes] = await Promise.all([
      supabase.from("property_analytics").select("id", { count: "exact", head: true }).eq("property_id", id).eq("event_type", "view"),
      supabase.from("property_analytics").select("id", { count: "exact", head: true }).eq("property_id", id).eq("event_type", "inquiry"),
      supabase.from("property_analytics").select("id", { count: "exact", head: true }).eq("property_id", id).eq("event_type", "favorite"),
      supabase.from("property_analytics").select("id", { count: "exact", head: true }).eq("property_id", id).eq("event_type", "share"),
    ]);

    // Get views by day (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentViews } = await supabase
      .from("property_analytics")
      .select("created_at")
      .eq("property_id", id)
      .eq("event_type", "view")
      .gte("created_at", thirtyDaysAgo);

    // Group by day
    const viewsByDay: Record<string, number> = {};
    for (const view of recentViews || []) {
      const day = new Date(view.created_at).toISOString().split("T")[0];
      viewsByDay[day] = (viewsByDay[day] || 0) + 1;
    }

    return NextResponse.json({
      views: viewsRes.count || 0,
      inquiries: inquiriesRes.count || 0,
      favorites: favoritesRes.count || 0,
      shares: sharesRes.count || 0,
      viewsByDay,
    });
  } catch (err) {
    logger.error("Property analytics error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
