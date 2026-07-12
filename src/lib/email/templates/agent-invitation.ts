import type { Locale } from "@/i18n/config";

interface AgentInvitationParams {
  locale: Locale;
  officeName: string;
  inviterName: string;
  invitationUrl: string;
}

export function agentInvitationEmail(params: AgentInvitationParams) {
  const { locale, officeName, inviterName, invitationUrl } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? `دعوة للانضمام إلى ${officeName} على Aqar Cloud`
    : `Invitation to join ${officeName} on Aqar Cloud`;

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1B2D4F;padding:24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">Aqar Cloud</h1>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1B2D4F;margin:0 0 16px;font-size:18px;">
      ${isAr ? "أنت مدعو للانضمام" : "You're Invited"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 16px;">
      ${isAr
        ? `${inviterName} من مكتب ${officeName} دعاك للانضمام كوكيل عقارات على منصة Aqar Cloud.`
        : `${inviterName} from ${officeName} has invited you to join as a real estate agent on Aqar Cloud.`}
    </p>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr
        ? "انقر على الزر أدناه لإعداد حسابك والبدء:"
        : "Click the button below to set up your account and get started:"}
    </p>

    <a href="${invitationUrl}"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:600;">
      ${isAr ? "قبول الدعوة" : "Accept Invitation"}
    </a>

    <p style="color:#9ca3af;font-size:12px;margin:24px 0 0;">
      ${isAr
        ? `رابط الدعوة صالح لمدة 7 أيام. إذا لم تطلب هذه الدعوة، يمكنك تجاهل هذا البريد الإلكتروني.`
        : `This invitation link is valid for 7 days. If you didn't request this invitation, you can safely ignore this email.`}
    </p>
  </div>
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
      ${isAr ? "© 2026 Aqar Cloud. جميع الحقوق محفوظة." : "© 2026 Aqar Cloud. All rights reserved."}
    </p>
  </div>
</div>
</body>
</html>`;

  const text = isAr
    ? `أنت مدعو للانضمام إلى ${officeName} على Aqar Cloud\n\n${inviterName} من مكتب ${officeName} دعاك للانضمام كوكيل عقارات.\n\nرابط الدعوة: ${invitationUrl}\n\nصالح لمدة 7 أيام.`
    : `You're Invited to join ${officeName} on Aqar Cloud\n\n${inviterName} from ${officeName} has invited you to join as a real estate agent.\n\nInvitation link: ${invitationUrl}\n\nValid for 7 days.`;

  return { subject, html, text };
}
