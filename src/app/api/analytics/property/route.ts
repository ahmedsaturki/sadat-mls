import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

// POST - Record a property analytics event (view, inquiry, favorite, share)
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`analytics-property:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { property_id, event_type, metadata } = body as {
      property_id?: string;
      event_type?: string;
      metadata?: Record<string, unknown>;
    };

    if (!property_id || !event_type) {
      return NextResponse.json({ error: "property_id and event_type required" }, { status: 400 });
    }

    if (!["view", "inquiry", "favorite", "share"].includes(event_type)) {
      return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get the property's office_id
    const { data: property } = await supabase
      .from("properties")
      .select("office_id")
      .eq("id", property_id)
      .maybeSingle();

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Try to get visitor ID from auth header (optional)
    let visitorId: string | null = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        visitorId = user?.id || null;
      } catch {
        // Not authenticated — that's fine for view tracking
      }
    }

    // Record the event
    const { error } = await supabase
      .from("property_analytics")
      .insert({
        property_id,
        office_id: property.office_id,
        event_type,
        visitor_id: visitorId,
        metadata: metadata || {},
      });

    if (error) {
      logger.error("Failed to record analytics", { error: error.message });
      return NextResponse.json({ error: "Failed to record" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Analytics record error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
