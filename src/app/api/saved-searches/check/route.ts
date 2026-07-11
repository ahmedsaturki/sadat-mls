import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { validateCsrfToken } from "@/lib/security/csrf";
import { logger } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// POST - Check saved searches for new matching properties + send email alerts
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`saved-searches-check:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    const csrfValid = await validateCsrfToken(request);
    if (!csrfValid) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 403 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceRole = createServiceRoleClient();

    // Get user's active saved searches
    const { data: searches, error: searchError } = await serviceRole
      .from("saved_searches")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (searchError || !searches?.length) {
      return NextResponse.json({ searches: 0, matches: 0, emailsSent: 0 });
    }

    // Get user email for sending
    const { data: userData } = await serviceRole.auth.admin.getUserById(user.id);
    const userEmail = userData?.user?.email;
    if (!userEmail) {
      return NextResponse.json({ error: "No email found" }, { status: 400 });
    }

    let totalMatches = 0;
    let emailsSent = 0;

    for (const search of searches) {
      const filters = search.filters as Record<string, unknown>;
      const lastChecked = search.last_checked_at || search.created_at;

      // Build query
      let query = serviceRole
        .from("properties")
        .select("id, title, price, area, bedrooms, bathrooms, status")
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

      if (matchError || !matchingProperties?.length) continue;

      totalMatches += matchingProperties.length;

      // Send email
      const { isEmailEnabled } = await import("@/lib/email/config");
      if (isEmailEnabled()) {
        const { sendEmail } = await import("@/lib/email/send");
        const { savedSearchAlertEmail } = await import("@/lib/email/templates");

        const formatPrice = (p: number) => new Intl.NumberFormat("ar-EG").format(p) + " EGP";

        const { subject, html, text } = savedSearchAlertEmail({
          locale: "ar",
          userName: userData?.user?.user_metadata?.full_name || "User",
          searchName: search.name,
          properties: matchingProperties.map((p: Record<string, unknown>) => ({
            id: p.id as string,
            title: p.title as string,
            price: p.price as number,
            area: p.area as number,
            bedrooms: p.bedrooms as number,
            zone: undefined,
          })),
        });

        await sendEmail({ to: userEmail, subject, html, text });
        emailsSent++;
      }

      // Update last_checked_at and last_notified_at
      await serviceRole
        .from("saved_searches")
        .update({
          last_checked_at: new Date().toISOString(),
          last_notified_at: new Date().toISOString(),
        })
        .eq("id", search.id);
    }

    return NextResponse.json({
      searches: searches.length,
      matches: totalMatches,
      emailsSent,
    });
  } catch (err) {
    logger.error("Saved search check error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
