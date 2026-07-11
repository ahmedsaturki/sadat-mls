import type { Locale } from "@/i18n/config";

interface AgentJoinedEmailParams {
  locale: Locale;
  officeName: string;
  agentName: string;
  agentEmail: string;
  role: string;
}

export function agentJoinedEmail(params: AgentJoinedEmailParams) {
  const { locale, officeName, agentName, agentEmail, role } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? `عضو جديد انضم إلى ${officeName}`
    : `New member joined ${officeName}`;

  const roleLabel = isAr
    ? (role === "office_admin" ? "مدير المكتب" : "مندوب")
    : (role === "office_admin" ? "Office Admin" : "Office Agent");

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
      ${isAr ? "عضو جديد في الفريق" : "New Team Member"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? `مرحباً ${officeName}` : `Hello ${officeName}`}
    </p>

    <div style="background:#f0fdf4;border-radius:12px;padding:20px;margin-bottom:24px;border:1px solid #bbf7d0;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">${isAr ? "الاسم" : "Name"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${agentName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">${isAr ? "البريد الإلكتروني" : "Email"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;">${agentEmail}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">${isAr ? "الدور" : "Role"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${roleLabel}</td>
        </tr>
      </table>
    </div>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/agents"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "إدارة الفريق" : "Manage Team"}
    </a>
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
    ? `عضو جديد انضم إلى ${officeName}\n\nالاسم: ${agentName}\nالبريد: ${agentEmail}\nالدور: ${roleLabel}`
    : `New team member joined ${officeName}\n\nName: ${agentName}\nEmail: ${agentEmail}\nRole: ${roleLabel}`;

  return { subject, html, text };
}
