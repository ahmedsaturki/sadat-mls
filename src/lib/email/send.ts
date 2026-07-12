import { isEmailEnabled, getResendClient, EMAIL_FROM } from "./config";
import { logger } from "@/lib/logger";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email via Resend.
 * Fire-and-forget: logs errors but never throws.
 * Returns silently if RESEND_API_KEY is not configured.
 */
export async function sendEmail(params: SendEmailParams): Promise<void> {
  if (!isEmailEnabled()) {
    logger.warn("Email not configured — skipping send", { to: params.to });
    return;
  }

  try {
    const client = getResendClient();
    if (!client) return;

    await client.emails.send({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });
  } catch (err) {
    logger.error("Failed to send email", {
      error: err instanceof Error ? err.message : String(err),
      to: params.to,
      subject: params.subject,
    });
  }
}
