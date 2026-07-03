import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";

interface LogActivityParams {
  userId: string;
  officeId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  entityTitle?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Log an activity to the activity_log table.
 * Call this from API routes or server actions after a CRUD operation.
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("activity_log")
      .insert({
        user_id: params.userId,
        office_id: params.officeId || null,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId || null,
        entity_title: params.entityTitle || null,
        metadata: params.metadata || {},
        ip_address: params.ipAddress || null,
      });

    if (error) {
      logger.error("Failed to log activity", { error: error.message, action: params.action });
    }
  } catch (err) {
    logger.error("Activity logging error", { error: err instanceof Error ? err.message : String(err) });
  }
}
