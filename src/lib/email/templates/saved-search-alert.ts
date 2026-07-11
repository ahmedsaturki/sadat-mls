import type { Locale } from "@/i18n/config";

interface Property {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  zone?: string;
}

interface SavedSearchAlertParams {
  locale: Locale;
  userName: string;
  searchName: string;
  properties: Property[];
}

export function savedSearchAlertEmail(params: SavedSearchAlertParams) {
  const { locale, userName, searchName, properties } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? `${properties.length} عقارات جديدة تطابق بحثك "${searchName}"`
    : `${properties.length} new properties match your search "${searchName}"`;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(isAr ? "ar-EG" : "en-US").format(price) + " EGP";

  const propertyRows = properties.map((p) => `
    <tr>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;">
        <p style="color:#1f2937;font-size:14px;font-weight:600;margin:0;">${p.title}</p>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">
          ${p.bedrooms} ${isAr ? "غرف" : "bed"} · ${p.area} m²${p.zone ? ` · ${p.zone}` : ""}
        </p>
      </td>
      <td style="padding:12px;border-bottom:1px solid #f3f4f6;text-align:${isAr ? "left" : "right"};">
        <p style="color:#1B2D4F;font-size:14px;font-weight:600;margin:0;">${formatPrice(p.price)}</p>
      </td>
    </tr>
  `).join("");

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
      ${isAr ? "عقارات جديدة تطابق بحثك" : "New Properties Match Your Search"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 8px;">
      ${isAr ? `مرحباً ${userName}` : `Hello ${userName}`}
    </p>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? `وجدنا ${properties.length} عقار(عقارات) جديدة تطابق بحثك المحفوظ "${searchName}"` : `We found ${properties.length} new properties matching your saved search "${searchName}"`}
    </p>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      ${propertyRows}
    </table>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/saved-searches"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "عرض البحث المحفوظ" : "View Saved Search"}
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

  const propertyList = properties.map((p) =>
    `- ${p.title}: ${formatPrice(p.price)} (${p.area}m², ${p.bedrooms} ${isAr ? "غرف" : "bed"})`
  ).join("\n");

  const text = isAr
    ? `عقارات جديدة تطابق بحثك "${searchName}"\n\n${propertyList}\n\nعرض البحث المحفوظ: ${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/saved-searches`
    : `New properties match your search "${searchName}"\n\n${propertyList}\n\nView saved search: ${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/saved-searches`;

  return { subject, html, text };
}
