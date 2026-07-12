import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { checkApiRateLimit } from "@/lib/security/rateLimit";
import { logger } from "@/lib/logger";

/**
 * Send email notification to office members when a new property is listed.
 * Called from PropertyForm after successful property creation.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rateResult = await checkApiRateLimit(`notify-new-listing:${ip}`);
    if (!rateResult.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: rateResult.headers });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { officeId, propertyId } = body as { officeId?: string; propertyId?: string };
    if (!officeId || !propertyId) {
      return NextResponse.json({ error: "officeId and propertyId required" }, { status: 400 });
    }

    const supabase = createServiceRoleClient();

    // Get property details
    const { data: property } = await supabase
      .from("properties")
      .select("title, price, area, bedrooms")
      .eq("id", propertyId)
      .maybeSingle();

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Get office name
    const { data: office } = await supabase
      .from("offices")
      .select("name")
      .eq("id", officeId)
      .maybeSingle();

    const officeName = office?.name || "Office";
    const { data: members } = await supabase
      .from("users")
      .select("email, notification_preferences")
      .eq("office_id", officeId)
      .eq("is_active", true);

    if (!members?.length) {
      return NextResponse.json({ success: true, emailsSent: 0 });
    }

    // Import email functions
    const { isEmailEnabled } = await import("@/lib/email/config");
    const { sendEmail } = await import("@/lib/email/send");
    const { newListingEmail } = await import("@/lib/email/templates/new-listing");

    if (!isEmailEnabled()) {
      return NextResponse.json({ success: true, emailsSent: 0, note: "Email not configured" });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";
    let emailsSent = 0;

    for (const member of members) {
      if (!member.email) continue;

      // Check notification preferences
      const prefs = member.notification_preferences;
      if (prefs && typeof prefs === "object" && prefs.property_status_email === false) continue;

      const { subject, html, text } = newListingEmail({
        locale: "ar",
        officeName,
        propertyTitle: property.title,
        propertyPrice: property.price,
        propertyArea: property.area,
        propertyBedrooms: property.bedrooms,
        propertyUrl: `${siteUrl}/ar/explore/${propertyId}`,
      });

      await sendEmail({ to: member.email, subject, html, text });
      emailsSent++;
    }

    // Send push notifications (fire-and-forget)
    try {
      const { sendNewListingPush } = await import("@/lib/push/send");
      sendNewListingPush(officeId, property.title, propertyId).catch(() => {});
    } catch {
      // Push is optional
    }

    return NextResponse.json({ success: true, emailsSent });
  } catch (err) {
    logger.error("New listing notification error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
