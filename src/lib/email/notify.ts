import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import { sendEmail } from "./send";
import { contactRequestEmail, agentJoinedEmail, welcomeEmail, propertyStatusChangeEmail } from "./templates";
import type { Locale } from "@/i18n/config";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Check if a user has email notifications enabled for a specific type.
 * Checks notification_preferences JSONB for the email key (e.g. "contact_request_email").
 */
async function isEmailNotificationEnabled(
  client: SupabaseClient,
  userId: string,
  emailPrefKey: string,
): Promise<boolean> {
  const { data, error } = await client
    .from("users")
    .select("notification_preferences")
    .eq("id", userId)
    .single();

  if (error || !data) return true;

  const prefs = data.notification_preferences;
  if (!prefs || typeof prefs !== "object") return true;

  return prefs[emailPrefKey] !== false;
}

/**
 * Send contact request email to office members.
 */
export async function sendContactRequestNotification(
  officeId: string,
  propertyTitle: string | null,
  visitorName: string,
  visitorEmail: string | null,
  visitorPhone: string | null,
  message: string,
  supabase?: SupabaseClient,
): Promise<void> {
  try {
    const client = supabase || await createClient();

    // Get office members with email addresses
    const { data: members, error } = await client
      .from("users")
      .select("id, email, notification_preferences")
      .eq("office_id", officeId)
      .eq("is_active", true);

    if (error || !members?.length) return;

    // Get office name
    const { data: office } = await client
      .from("offices")
      .select("name")
      .eq("id", officeId)
      .single();

    const officeName = office?.name || "Office";

    for (const member of members) {
      if (!member.email) continue;

      const enabled = await isEmailNotificationEnabled(client, member.id, "contact_request_email");
      if (!enabled) continue;

      // Determine locale from user preferences or default to Arabic
      const locale: Locale = "ar";

      const { subject, html, text } = contactRequestEmail({
        locale,
        officeName,
        visitorName,
        visitorEmail: visitorEmail || undefined,
        visitorPhone: visitorPhone || undefined,
        message,
        propertyTitle: propertyTitle || undefined,
      });

      await sendEmail({ to: member.email, subject, html, text });
    }
  } catch (err) {
    logger.error("Failed to send contact request emails", {
      error: err instanceof Error ? err.message : String(err),
      officeId,
    });
  }
}

/**
 * Send agent joined email to office admin.
 */
export async function sendAgentJoinedNotification(
  officeId: string,
  agentName: string,
  agentEmail: string,
  role: string,
  supabase?: SupabaseClient,
): Promise<void> {
  try {
    const client = supabase || await createClient();

    // Get office admin
    const { data: admins } = await client
      .from("users")
      .select("id, email, notification_preferences")
      .eq("office_id", officeId)
      .eq("role", "office_admin")
      .eq("is_active", true);

    if (!admins?.length) return;

    const { data: office } = await client
      .from("offices")
      .select("name")
      .eq("id", officeId)
      .single();

    const officeName = office?.name || "Office";

    for (const admin of admins) {
      if (!admin.email) continue;

      const enabled = await isEmailNotificationEnabled(client, admin.id, "agent_joined_email");
      if (!enabled) continue;

      const locale: Locale = "ar";

      const { subject, html, text } = agentJoinedEmail({
        locale,
        officeName,
        agentName,
        agentEmail,
        role,
      });

      await sendEmail({ to: admin.email, subject, html, text });
    }
  } catch (err) {
    logger.error("Failed to send agent joined emails", {
      error: err instanceof Error ? err.message : String(err),
      officeId,
    });
  }
}

/**
 * Send welcome email to new user.
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  officeName?: string,
): Promise<void> {
  try {
    const locale: Locale = "ar";

    const { subject, html, text } = welcomeEmail({
      locale,
      userName,
      officeName,
    });

    await sendEmail({ to: userEmail, subject, html, text });
  } catch (err) {
    logger.error("Failed to send welcome email", {
      error: err instanceof Error ? err.message : String(err),
      to: userEmail,
    });
  }
}

/**
 * Send property status change email to office members.
 */
export async function sendPropertyStatusChangeNotification(
  officeId: string,
  propertyTitle: string,
  oldStatus: string,
  newStatus: string,
  supabase?: SupabaseClient,
): Promise<void> {
  try {
    const client = supabase || await createClient();

    const { data: members } = await client
      .from("users")
      .select("id, email, notification_preferences")
      .eq("office_id", officeId)
      .eq("is_active", true);

    if (!members?.length) return;

    const { data: office } = await client
      .from("offices")
      .select("name")
      .eq("id", officeId)
      .single();

    const officeName = office?.name || "Office";

    for (const member of members) {
      if (!member.email) continue;

      const enabled = await isEmailNotificationEnabled(client, member.id, "property_status_email");
      if (!enabled) continue;

      const locale: Locale = "ar";

      const { subject, html, text } = propertyStatusChangeEmail({
        locale,
        officeName,
        propertyTitle,
        oldStatus,
        newStatus,
      });

      await sendEmail({ to: member.email, subject, html, text });
    }
  } catch (err) {
    logger.error("Failed to send property status change emails", {
      error: err instanceof Error ? err.message : String(err),
      officeId,
    });
  }
}
