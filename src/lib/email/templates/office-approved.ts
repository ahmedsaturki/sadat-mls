import type { Locale } from "@/i18n/config";

interface OfficeApprovedEmailParams {
  locale: Locale;
  officeName: string;
  adminName: string;
  approved: boolean;
}

export function officeApprovedEmail(params: OfficeApprovedEmailParams) {
  const { locale, officeName, adminName, approved } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? (approved ? `تمت الموافقة على مكتبك: ${officeName}` : `تم رفض تسجيل مكتبك: ${officeName}`)
    : (approved ? `Your office has been approved: ${officeName}` : `Your office registration was not approved: ${officeName}`);

  const statusColor = approved ? "#22c55e" : "#ef4444";
  const statusText = isAr ? (approved ? "تمت الموافقة" : "مرفوض") : (approved ? "Approved" : "Rejected");
  const bodyText = isAr
    ? (approved
      ? `مرحباً ${adminName}،\n\nتمت الموافقة على مكتبك "${officeName}" بنجاح. يمكنك الآن تسجيل الدخول والبدء في إدارة عقاراتك.`
      : `مرحباً ${adminName}،\n\nلم تتم الموافقة على تسجيل مكتبك "${officeName}". يرجى التواصل مع الدعم للحصول على مزيد من المعلومات.`)
    : (approved
      ? `Hello ${adminName},\n\nYour office "${officeName}" has been approved. You can now log in and start managing your properties.`
      : `Hello ${adminName},\n\nYour office registration "${officeName}" was not approved. Please contact support for more information.`);

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1B2D4F;padding:24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">Aqar Cloud</h1>
  </div>
  <div style="padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:${statusColor}20;margin-bottom:16px;">
        <span style="font-size:32px;">${approved ? "✓" : "✗"}</span>
      </div>
      <h2 style="color:#1B2D4F;margin:0 0 8px;font-size:20px;">${statusText}</h2>
      <p style="color:#6b7280;font-size:14px;margin:0;">${officeName}</p>
    </div>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#1f2937;font-size:14px;line-height:1.6;margin:0;">
        ${isAr
          ? (approved
            ? `مرحباً ${adminName}،<br><br>تمت الموافقة على مكتبك "<strong>${officeName}</strong>" بنجاح. يمكنك الآن تسجيل الدخول والبدء في إدارة عقاراتك.`
            : `مرحباً ${adminName}،<br><br>لم تتم الموافقة على تسجيل مكتبك "<strong>${officeName}</strong>". يرجى التواصل مع الدعم للحصول على مزيد من المعلومات.`)
          : (approved
            ? `Hello ${adminName},<br><br>Your office "<strong>${officeName}</strong>" has been approved. You can now log in and start managing your properties.`
            : `Hello ${adminName},<br><br>Your office registration "<strong>${officeName}</strong>" was not approved. Please contact support for more information.`)
        }
      </p>
    </div>

    ${approved ? `<a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/login"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "تسجيل الدخول" : "Log In"}
    </a>` : `<a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/contact"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "تواصل معنا" : "Contact Us"}
    </a>`}
  </div>
  <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">
      ${isAr ? "© 2026 Aqar Cloud. جميع الحقوق محفوظة." : "© 2026 Aqar Cloud. All rights reserved."}
    </p>
  </div>
</div>
</body>
</html>`;

  return { subject, html, text: bodyText };
}
