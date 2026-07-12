/**
 * Server-side push notification delivery.
 * Uses web-push library with VAPID keys for reliable delivery.
 */
import webPush from "web-push";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { logger } from "@/lib/logger";

// Configure VAPID keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || "mailto:admin@sadat-mls.vercel.app";

let vapidConfigured = false;

function ensureVapidConfigured(): boolean {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    logger.warn("VAPID keys not configured — push notifications disabled");
    return false;
  }
  try {
    webPush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    vapidConfigured = true;
    return true;
  } catch (err) {
    logger.error("Failed to configure VAPID", { error: err instanceof Error ? err.message : String(err) });
    return false;
  }
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  icon?: string;
  badge?: string;
}

/**
 * Send a push notification to a specific user.
 * Looks up their stored subscription and sends via web-push.
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) return { sent: 0, failed: 0 };

  const supabase = createServiceRoleClient();

  // Get user's push subscription
  const { data: user, error } = await supabase
    .from("users")
    .select("push_subscription, notification_preferences")
    .eq("id", userId)
    .single();

  if (error || !user) return { sent: 0, failed: 0 };

  // Check if push notifications are enabled
  const prefs = user.notification_preferences;
  if (prefs && typeof prefs === "object" && prefs.push_notifications === false) {
    return { sent: 0, failed: 0 };
  }

  if (!user.push_subscription) return { sent: 0, failed: 0 };

  const subscription = user.push_subscription as { endpoint: string; keys: { p256dh: string; auth: string } };

  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || "/",
        icon: payload.icon || "/icons/icon-192.png",
        badge: payload.badge || "/icons/icon-96.png",
      }),
      {
        TTL: 60 * 60, // 1 hour
        vapidDetails: {
          subject: VAPID_EMAIL,
          publicKey: VAPID_PUBLIC_KEY!,
          privateKey: VAPID_PRIVATE_KEY!,
        },
      },
    );

    return { sent: 1, failed: 0 };
  } catch (err: unknown) {
    // If subscription is expired/invalid, clean it up
    const statusCode = (err as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      logger.info("Removing invalid push subscription", { userId });
      await supabase
        .from("users")
        .update({ push_subscription: null })
        .eq("id", userId);
    } else {
      logger.error("Push notification failed", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    return { sent: 0, failed: 1 };
  }
}

/**
 * Send push notifications to all members of an office.
 */
export async function sendPushToOffice(
  officeId: string,
  payload: PushPayload,
  excludeUserId?: string,
): Promise<{ sent: number; failed: number }> {
  if (!ensureVapidConfigured()) return { sent: 0, failed: 0 };

  const supabase = createServiceRoleClient();

  // Get office members with push subscriptions
  let query = supabase
    .from("users")
    .select("id")
    .eq("office_id", officeId)
    .eq("is_active", true)
    .not("push_subscription", "is", null);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { data: members } = await query;

  if (!members?.length) return { sent: 0, failed: 0 };

  let sent = 0;
  let failed = 0;

  // Send to all members in parallel (fire-and-forget)
  await Promise.allSettled(
    members.map(async (member) => {
      const result = await sendPushToUser(member.id, payload);
      sent += result.sent;
      failed += result.failed;
    }),
  );

  return { sent, failed };
}

/**
 * Send push notification for a new property listing.
 */
export async function sendNewListingPush(officeId: string, propertyTitle: string, propertyId: string) {
  return sendPushToOffice(officeId, {
    title: "New Listing",
    body: `New property listed: ${propertyTitle}`,
    url: `/explore/${propertyId}`,
  });
}

/**
 * Send push notification for a new offer.
 */
export async function sendNewOfferPush(officeId: string, propertyTitle: string, offerAmount: number) {
  return sendPushToOffice(officeId, {
    title: "New Offer",
    body: `New offer of ${new Intl.NumberFormat("en-US").format(offerAmount)} EGP on ${propertyTitle}`,
    url: "/dashboard/offers",
  });
}

/**
 * Send push notification for a new referral.
 */
export async function sendNewReferralPush(officeId: string, clientName: string) {
  return sendPushToOffice(officeId, {
    title: "New Referral",
    body: `New referral received from ${clientName}`,
    url: "/dashboard/referrals",
  });
}
