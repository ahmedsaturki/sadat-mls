import type { Locale } from "@/i18n/config";

interface OfficeRegisteredEmailParams {
  locale: Locale;
  officeName: string;
  adminName: string;
}

export function officeRegisteredEmail(params: OfficeRegisteredEmailParams) {
  const { locale, officeName, adminName } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? `تسجيل مكتب جديد: ${officeName}`
    : `New office registration: ${officeName}`;

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
      ${isAr ? "تسجيل مكتب جديد" : "New Office Registration"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? "لقد سجل مكتب جديد في المنصة وينتظر الموافقة" : "A new office has registered on the platform and is pending approval"}
    </p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">${isAr ? "المكتب" : "Office"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${officeName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">${isAr ? "المدير" : "Admin"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;">${adminName}</td>
        </tr>
      </table>
    </div>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/admin/office-registrations"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "مراجعة التسجيلات" : "Review Registrations"}
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
    ? `تسجيل مكتب جديد\n\nالمكتب: ${officeName}\nالمدير: ${adminName}\n\nمراجعة التسجيلات: ${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/admin/office-registrations`
    : `New Office Registration\n\nOffice: ${officeName}\nAdmin: ${adminName}\n\nReview: ${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/admin/office-registrations`;

  return { subject, html, text };
}
