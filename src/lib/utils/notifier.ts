import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationParams {
  userId: string;
  officeId?: string | null;
  type: string;
  title: string;
  message: string;
  title_params?: Record<string, string | number>;
  message_params?: Record<string, string | number>;
  entityType?: string | null;
  entityId?: string | null;
  supabase?: SupabaseClient;
}

/**
 * Check if a user has enabled a specific notification type.
 * Defaults to true if no preferences are set.
 */
async function isNotificationEnabled(
  client: SupabaseClient,
  userId: string,
  notificationType: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("users")
    .select("notification_preferences")
    .eq("id", userId)
    .single();

  if (error || !data) return true; // Default: enabled

  const prefs = data.notification_preferences;
  if (!prefs || typeof prefs !== "object") return true; // Default: enabled

  // If the specific type key exists, use its value; otherwise default to true
  return prefs[notificationType] !== false;
}

/**
 * Create a notification for a user.
 * Respects user notification preferences.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = params.supabase || await createClient();

    // Check if user has this notification type enabled
    const enabled = await isNotificationEnabled(supabase, params.userId, params.type);
    if (!enabled) {
      return; // User opted out of this notification type
    }

    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        office_id: params.officeId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        title_params: params.title_params ? JSON.stringify(params.title_params) : null,
        message_params: params.message_params ? JSON.stringify(params.message_params) : null,
        entity_type: params.entityType || null,
        entity_id: params.entityId || null,
      });

    if (error) {
      logger.error("Failed to create notification", { error: error.message, type: params.type });
    }
  } catch (err) {
    logger.error("Notification creation error", { error: err instanceof Error ? err.message : String(err) });
  }
}

/**
 * Create notifications for all office members.
 * Filters out members who have opted out of the notification type.
 */
export async function notifyOffice(
  officeId: string,
  notification: Omit<CreateNotificationParams, "userId" | "officeId">,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    const client = supabase || await createClient();

    // Get all users in the office with their preferences
    const { data: members, error: queryError } = await client
      .from("users")
      .select("id, notification_preferences")
      .eq("office_id", officeId);

    if (queryError || !members) {
      logger.error("Failed to fetch office members for notification", { officeId });
      return;
    }

    // Filter members by notification preferences
    const eligibleMembers = members.filter((member) => {
      const prefs = member.notification_preferences;
      if (!prefs || typeof prefs !== "object") return true; // Default: enabled
      return prefs[notification.type] !== false;
    });

    if (eligibleMembers.length === 0) return; // No one wants this notification

    // Create notifications for eligible members
    const notifications = eligibleMembers.map((member) => ({
      user_id: member.id,
      office_id: officeId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      title_params: notification.title_params ? JSON.stringify(notification.title_params) : null,
      message_params: notification.message_params ? JSON.stringify(notification.message_params) : null,
      entity_type: notification.entityType || null,
      entity_id: notification.entityId || null,
    }));

    const { error } = await client
      .from("notifications")
      .insert(notifications);

    if (error) {
      logger.error("Failed to create office notifications", { error: error.message, officeId });
    }
  } catch (err) {
    logger.error("Office notification error", { error: err instanceof Error ? err.message : String(err) });
  }
}
