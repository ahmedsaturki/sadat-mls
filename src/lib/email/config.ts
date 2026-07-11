import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM = "Aqar Cloud <onboarding@resend.dev>";
// Note: For production, verify a custom domain in Resend dashboard
// and update EMAIL_FROM to use your verified domain.

export const isEmailEnabled = () => !!resend;
