import { Resend } from "resend";

const EMAIL_FROM = "Aqar Cloud <onboarding@resend.dev>";

function getClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

/**
 * Check if email is configured (reads env var at runtime, not build time).
 */
export function isEmailEnabled(): boolean {
  return !!process.env.RESEND_API_KEY;
}

/**
 * Get the Resend client (creates fresh instance per call to avoid stale env vars).
 */
export function getResendClient() {
  return getClient();
}

export { EMAIL_FROM };
