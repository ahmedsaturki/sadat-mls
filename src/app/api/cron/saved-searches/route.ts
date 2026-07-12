import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

/**
 * Cron endpoint for saved search auto-alerts.
 * Runs daily (e.g., 8 AM via Vercel Cron) to check all active saved searches
 * and email users when new properties match their criteria.
 *
 * Secure with CRON_SECRET env var.
 *
 * vercel.json: { "path": "/api/cron/saved-searches", "schedule": "0 8 * * *" }
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceRoleClient();

    // Get all active saved searches with user info
    const { data: searches, error: searchError } = await supabase
      .from("saved_searches")
      .select("*, users!inner(id, email, locale, notification_preferences)")
      .eq("is_active", true);

    if (searchError) {
      logger.error("Failed to fetch saved searches for cron", { error: searchError.message });
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!searches?.length) {
      return NextResponse.json({ searches: 0, matches: 0, emailsSent: 0 });
    }

    let totalMatches = 0;
    let emailsSent = 0;
    let skipped = 0;

    for (const search of searches) {
      const user = search.users as unknown as {
        id: string;
        email: string;
        locale: string;
        notification_preferences: Record<string, unknown> | null;
      };

      // Skip if user has disabled saved search emails
      if (user.notification_preferences?.saved_search_email === false) {
        skipped++;
        continue;
      }

      if (!user.email) {
        skipped++;
        continue;
      }

      const filters = search.filters as Record<string, unknown>;
      const lastChecked = search.last_checked_at || search.created_at;

      // Build property query
      let query = supabase
        .from("properties")
        .select("id, title, price, area, bedrooms, bathrooms, status, zone_id")
        .eq("status", "available")
        .eq("is_active", true)
        .gt("created_at", lastChecked);

      if (filters.zoneId) query = query.eq("zone_id", filters.zoneId);
      if (filters.typeId) query = query.eq("property_type_id", filters.typeId);
      if (filters.minPrice) query = query.gte("price", Number(filters.minPrice));
      if (filters.maxPrice) query = query.lte("price", Number(filters.maxPrice));
      if (filters.minArea) query = query.gte("area", Number(filters.minArea));
      if (filters.maxArea) query = query.lte("area", Number(filters.maxArea));
      if (filters.bedrooms) query = query.gte("bedrooms", Number(filters.bedrooms));
      if (filters.bathrooms) query = query.gte("bathrooms", Number(filters.bathrooms));
      if (filters.hasBalcony) query = query.eq("has_balcony", true);
      if (filters.hasParking) query = query.eq("has_parking", true);
      if (filters.hasElevator) query = query.eq("has_elevator", true);

      const { data: matchingProperties, error: matchError } = await query.limit(10);

      if (matchError || !matchingProperties?.length) {
        // Still update last_checked_at even with no matches
        await supabase
          .from("saved_searches")
          .update({ last_checked_at: new Date().toISOString() })
          .eq("id", search.id);
        continue;
      }

      totalMatches += matchingProperties.length;

      // Send email
      const { isEmailEnabled } = await import("@/lib/email/config");
      if (isEmailEnabled()) {
        const { sendEmail } = await import("@/lib/email/send");
        const { savedSearchAlertEmail } = await import("@/lib/email/templates");

        const locale = (user.locale as "ar" | "en") || "ar";

        // Get zone names for properties
        const zoneIds = [...new Set(matchingProperties.map((p) => p.zone_id).filter(Boolean))];
        let zoneMap: Record<string, string> = {};
        if (zoneIds.length > 0) {
          const { data: zones } = await supabase
            .from("zones")
            .select("id, name")
            .in("id", zoneIds);
          if (zones) {
            zoneMap = Object.fromEntries(zones.map((z) => [z.id, z.name]));
          }
        }

        const { subject, html, text } = savedSearchAlertEmail({
          locale,
          userName: user.email.split("@")[0],
          searchName: search.name,
          properties: matchingProperties.map((p) => ({
            id: p.id as string,
            title: p.title as string,
            price: p.price as number,
            area: p.area as number,
            bedrooms: p.bedrooms as number,
            zone: zoneMap[p.zone_id] || undefined,
          })),
        });

        await sendEmail({ to: user.email, subject, html, text });
        emailsSent++;
      }

      // Update timestamps
      await supabase
        .from("saved_searches")
        .update({
          last_checked_at: new Date().toISOString(),
          last_notified_at: new Date().toISOString(),
        })
        .eq("id", search.id);
    }

    logger.info("Saved search cron completed", {
      searches: searches.length,
      matches: totalMatches,
      emailsSent,
      skipped,
    });

    return NextResponse.json({
      success: true,
      searches: searches.length,
      matches: totalMatches,
      emailsSent,
      skipped,
    });
  } catch (err) {
    logger.error("Saved search cron error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
