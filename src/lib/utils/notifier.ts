import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { SupabaseClient } from "@supabase/supabase-js";

interface CreateNotificationParams {
  userId: string;
  officeId?: string | null;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  supabase?: SupabaseClient;
}

/**
 * Create a notification for a user.
 * Call this from API routes or server actions.
 * Pass `supabase` when calling from API routes to avoid cookie access issues.
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const supabase = params.supabase || await createClient();
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: params.userId,
        office_id: params.officeId || null,
        type: params.type,
        title: params.title,
        message: params.message,
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
 */
export async function notifyOffice(
  officeId: string,
  notification: Omit<CreateNotificationParams, "userId" | "officeId">,
  supabase?: SupabaseClient
): Promise<void> {
  try {
    const client = supabase || await createClient();

    // Get all users in the office
    const { data: members, error: queryError } = await client
      .from("users")
      .select("id")
      .eq("office_id", officeId);

    if (queryError || !members) {
      logger.error("Failed to fetch office members for notification", { officeId });
      return;
    }

    // Create notifications for all members
    const notifications = members.map((member) => ({
      user_id: member.id,
      office_id: officeId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
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
