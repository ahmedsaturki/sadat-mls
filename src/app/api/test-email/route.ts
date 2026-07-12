import { NextRequest, NextResponse } from "next/server";
import { isEmailEnabled } from "@/lib/email/config";
import { sendEmail } from "@/lib/email/send";
import { newListingEmail } from "@/lib/email/templates/new-listing";
import { contactRequestEmail } from "@/lib/email/templates/contact-request";
import { agentJoinedEmail } from "@/lib/email/templates/agent-joined";
import { welcomeEmail } from "@/lib/email/templates/welcome";
import { logger } from "@/lib/logger";

/**
 * Test endpoint to verify email is configured correctly.
 * DELETE this before production launch.
 *
 * Usage:
 *   GET /api/test-email?to=your@email.com                — generic test
 *   GET /api/test-email?to=your@email.com&type=new-listing — new listing template
 *   GET /api/test-email?to=your@email.com&type=contact    — contact request template
 *   GET /api/test-email?to=your@email.com&type=agent      — agent joined template
 *   GET /api/test-email?to=your@email.com&type=welcome    — welcome template
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

  try {
    const testEmail = request.nextUrl.searchParams.get("to") || "test@example.com";
    const emailType = request.nextUrl.searchParams.get("type") || "generic";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";

    let emailData: { subject: string; html: string; text: string };

    switch (emailType) {
      case "new-listing":
        emailData = newListingEmail({
          locale: "ar",
          officeName: "لارا للتسويق العقاري",
          propertyTitle: "شقة فاخرة في الحي الأول - 3 غرف نوم",
          propertyPrice: 1800000,
          propertyArea: 150,
          propertyBedrooms: 3,
          propertyUrl: `${siteUrl}/ar/explore/test123`,
        });
        break;

      case "contact":
        emailData = contactRequestEmail({
          locale: "ar",
          officeName: "لارا للتسويق العقاري",
          visitorName: "أحمد محمد",
          visitorEmail: testEmail,
          visitorPhone: "01012345678",
          message: "أريد معرفة تفاصيل أكثر عن العقار المتاح في الحي الأول",
          propertyTitle: "شقة فاخرة - 3 غرف",
        });
        break;

      case "agent":
        emailData = agentJoinedEmail({
          locale: "ar",
          officeName: "لارا للتسويق العقاري",
          agentName: "محمد علي",
          agentEmail: testEmail,
          role: "office_agent",
        });
        break;

      case "welcome":
        emailData = welcomeEmail({
          locale: "ar",
          userName: "أحمد",
          officeName: "لارا للتسويق العقاري",
        });
        break;

      default:
        emailData = {
          subject: "Aqar Cloud — Test Email",
          html: `<div style="font-family:sans-serif;padding:20px;"><h2 style="color:#1B2D4F;">Aqar Cloud Email Test</h2><p>This is a test email to verify email notifications are working.</p><p><strong>Time:</strong> ${new Date().toISOString()}</p><p style="color:#9ca3af;font-size:12px;">If you received this, Resend is configured correctly!</p></div>`,
          text: `Aqar Cloud Test Email\n\nTime: ${new Date().toISOString()}`,
        };
    }

    await sendEmail({
      to: testEmail,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text,
    });

    return NextResponse.json({
      ...results,
      status: "SENT",
      type: emailType,
      message: `Test email (${emailType}) sent to ${testEmail}. Check your inbox.`,
    });
  } catch (err) {
    logger.error("Test email failed", { error: err instanceof Error ? err.message : String(err) });
    return NextResponse.json({
      ...results,
      status: "FAILED",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
