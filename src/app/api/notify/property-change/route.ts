import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

const propertyChangeSchema = z.object({
  property_id: z.string().uuid(),
  change_type: z.enum(["status", "price"]),
  old_value: z.union([z.string(), z.number()]),
  new_value: z.union([z.string(), z.number()]),
});

/**
 * Send notifications for property changes (status or price).
 * Called fire-and-forget from the client after a property update.
 */
export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = propertyChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { property_id, change_type, old_value, new_value } = parsed.data;
    const supabase = createServiceRoleClient();

    // Get property details
    const { data: property } = await supabase
      .from("properties")
      .select("id, title, office_id, price, status")
      .eq("id", property_id)
      .single();

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Get users who favorited this property
    const { data: favorites } = await supabase
      .from("property_favorites")
      .select("user_id")
      .eq("property_id", property_id);

    const favoriterIds = (favorites || []).map((f) => f.user_id);

    // Get users with saved searches that match this property's criteria
    const { data: savedSearches } = await supabase
      .from("saved_searches")
      .select("id, user_id, filters")
      .eq("is_active", true);

    const matchingSearchUserIds: string[] = [];
    if (savedSearches?.length) {
      for (const search of savedSearches) {
        const filters = search.filters as Record<string, unknown>;
        let matches = true;
        if (filters.minPrice && property.price < Number(filters.minPrice)) matches = false;
        if (filters.maxPrice && property.price > Number(filters.maxPrice)) matches = false;
        if (filters.bedrooms && property.bedrooms < Number(filters.bedrooms)) matches = false;
        if (matches) {
          matchingSearchUserIds.push(search.user_id);
        }
      }
    }

    // Combine unique users to notify
    const allUserIds = [...new Set([...favoriterIds, ...matchingSearchUserIds])];

    if (allUserIds.length === 0) {
      return NextResponse.json({ success: true, notified: 0 });
    }

    // Get user details for notifications
    const { data: users } = await supabase
      .from("users")
      .select("id, email, notification_preferences, locale")
      .in("id", allUserIds);

    let emailsSent = 0;
    let pushSent = 0;

    for (const user of users || []) {
      const prefs = user.notification_preferences as Record<string, unknown> | null;

      // Email notifications
      const emailEnabled = !prefs || prefs.property_status_email !== false;
      if (emailEnabled && user.email) {
        const { isEmailEnabled } = await import("@/lib/email/config");
        if (isEmailEnabled()) {
          const { sendEmail } = await import("@/lib/email/send");

          if (change_type === "status") {
            const { propertyStatusChangeEmail } = await import("@/lib/email/templates");
            const locale = (user.locale as "ar" | "en") || "ar";
            const { subject, html, text } = propertyStatusChangeEmail({
              locale,
              officeName: "Aqar Cloud",
              propertyTitle: property.title,
              oldStatus: old_value as string,
              newStatus: new_value as string,
            });
            sendEmail({ to: user.email, subject, html, text }).catch(() => {});
            emailsSent++;
          } else if (change_type === "price") {
            const { priceDropEmail } = await import("@/lib/email/templates");
            const locale = (user.locale as "ar" | "en") || "ar";
            const { subject, html, text } = priceDropEmail({
              locale,
              propertyTitle: property.title,
              oldPrice: Number(old_value),
              newPrice: Number(new_value),
              propertyUrl: `/explore/${property_id}`,
            });
            sendEmail({ to: user.email, subject, html, text }).catch(() => {});
            emailsSent++;
          }
        }
      }

      // Push notifications
      const pushEnabled = !prefs || prefs.push_notifications !== false;
      if (pushEnabled) {
        try {
          const { sendPushToUser } = await import("@/lib/push/send");
          if (change_type === "status") {
            sendPushToUser(user.id, {
              title: "Property Status Changed",
              body: `${property.title} is now ${new_value}`,
              url: `/explore/${property_id}`,
            }).catch(() => {});
          } else {
            sendPushToUser(user.id, {
              title: "Price Drop Alert",
              body: `${property.title} dropped from ${old_value} to ${new_value} EGP`,
              url: `/explore/${property_id}`,
            }).catch(() => {});
          }
          pushSent++;
        } catch {
          // Push is optional
        }
      }
    }

    logger.info("Property change notifications sent", {
      property_id,
      change_type,
      usersNotified: allUserIds.length,
      emailsSent,
      pushSent,
    });

    return NextResponse.json({ success: true, notified: allUserIds.length, emailsSent, pushSent });
  } catch (err) {
    logger.error("Property change notification error", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
