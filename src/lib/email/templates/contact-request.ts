import type { Locale } from "@/i18n/config";

interface ContactRequestEmailParams {
  locale: Locale;
  officeName: string;
  visitorName: string;
  visitorEmail?: string;
  visitorPhone?: string;
  message: string;
  propertyTitle?: string;
}

export function contactRequestEmail(params: ContactRequestEmailParams) {
  const { locale, officeName, visitorName, visitorEmail, visitorPhone, message, propertyTitle } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? `طلب تواصل جديد من ${visitorName}`
    : `New inquiry from ${visitorName}`;

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
      ${isAr ? "طلب تواصل جديد" : "New Contact Request"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? `مرحباً ${officeName}` : `Hello ${officeName}`}
    </p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;width:120px;">${isAr ? "الاسم" : "Name"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${visitorName}</td>
        </tr>
        ${visitorEmail ? `<tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">${isAr ? "البريد الإلكتروني" : "Email"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;">${visitorEmail}</td>
        </tr>` : ""}
        ${visitorPhone ? `<tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">${isAr ? "الهاتف" : "Phone"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;">${visitorPhone}</td>
        </tr>` : ""}
        ${propertyTitle ? `<tr>
          <td style="padding:8px 0;color:#6b7280;font-size:13px;">${isAr ? "العقار" : "Property"}</td>
          <td style="padding:8px 0;color:#1f2937;font-size:14px;font-weight:600;">${propertyTitle}</td>
        </tr>` : ""}
      </table>
    </div>

    <div style="background:#f0f7ff;border-left:3px solid #1B2D4F;padding:16px;border-radius:0 8px 8px 0;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 4px;text-transform:uppercase;">${isAr ? "الرسالة" : "Message"}</p>
      <p style="color:#1f2937;font-size:14px;margin:0;line-height:1.6;">${message}</p>
    </div>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/contact-requests"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "عرض طلبات التواصل" : "View Contact Requests"}
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
    ? `طلب تواصل جديد\n\nالاسم: ${visitorName}\n${visitorEmail ? `البريد: ${visitorEmail}\n` : ""}${visitorPhone ? `الهاتف: ${visitorPhone}\n` : ""}${propertyTitle ? `العقار: ${propertyTitle}\n` : ""}\nالرسالة: ${message}`
    : `New Contact Request\n\nName: ${visitorName}\n${visitorEmail ? `Email: ${visitorEmail}\n` : ""}${visitorPhone ? `Phone: ${visitorPhone}\n` : ""}${propertyTitle ? `Property: ${propertyTitle}\n` : ""}\nMessage: ${message}`;

  return { subject, html, text };
}
