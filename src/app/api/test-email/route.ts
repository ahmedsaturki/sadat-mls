import { NextRequest, NextResponse } from "next/server";
import { isEmailEnabled } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { logger } from "@/lib/logger";

/**
 * Test endpoint to verify email is configured correctly.
 * DELETE this before production launch.
 */
export async function GET(request: NextRequest) {
  const results = {
    resendConfigured: isEmailEnabled(),
    apiKeyPresent: !!process.env.RESEND_API_KEY,
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "not set",
  };

  if (!isEmailEnabled()) {
    return NextResponse.json({
      ...results,
      status: "NOT_CONFIGURED",
      message: "RESEND_API_KEY is not set. Add it to Vercel environment variables.",
    });
  }

  // Try to send a test email
  try {
    const testEmail = request.nextUrl.searchParams.get("to") || "test@example.com";

    await sendEmail({
      to: testEmail,
      subject: "Aqar Cloud — Test Email",
      html: `
        <div style="font-family:sans-serif;padding:20px;">
          <h2 style="color:#1B2D4F;">Aqar Cloud Email Test</h2>
          <p>This is a test email to verify that email notifications are working correctly.</p>
          <p><strong>Time:</strong> ${new Date().toISOString()}</p>
          <p><strong>Site:</strong> ${process.env.NEXT_PUBLIC_SITE_URL || "sadat-mls.vercel.app"}</p>
          <hr style="border-color:#e5e7eb;margin:16px 0;">
          <p style="color:#9ca3af;font-size:12px;">If you received this email, Resend is configured correctly!</p>
        </div>
      `,
      text: `Aqar Cloud Test Email\n\nTime: ${new Date().toISOString()}\nSite: ${process.env.NEXT_PUBLIC_SITE_URL || "sadat-mls.vercel.app"}`,
    });

    return NextResponse.json({
      ...results,
      status: "SENT",
      message: `Test email sent to ${testEmail}. Check your inbox (and spam folder).`,
    });
  } catch (err) {
    logger.error("Test email failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({
      ...results,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
      message: "Failed to send test email. Check RESEND_API_KEY is valid.",
    });
  }
}
