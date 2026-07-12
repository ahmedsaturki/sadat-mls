import type { Locale } from "@/i18n/config";

interface NewListingEmailParams {
  locale: Locale;
  officeName: string;
  propertyTitle: string;
  propertyPrice: number;
  propertyArea: number;
  propertyBedrooms: number;
  propertyUrl: string;
}

export function newListingEmail(params: NewListingEmailParams) {
  const { locale, officeName, propertyTitle, propertyPrice, propertyArea, propertyBedrooms, propertyUrl } = params;
  const isAr = locale === "ar";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(isAr ? "ar-EG" : "en-US").format(price) + " EGP";

  const subject = isAr
    ? `عقار جديد: ${propertyTitle}`
    : `New listing: ${propertyTitle}`;

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
      ${isAr ? "عقار جديد متاح" : "New Listing Available"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? `تم إضافة عقار جديد في مكتب ${officeName}` : `A new property has been listed by ${officeName}`}
    </p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <h3 style="color:#1f2937;font-size:16px;margin:0 0 12px;font-weight:600;">${propertyTitle}</h3>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">${isAr ? "السعر" : "Price"}</td>
          <td style="padding:6px 0;color:#1B2D4F;font-size:14px;font-weight:700;text-align:${isAr ? "left" : "right"};">${formatPrice(propertyPrice)}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">${isAr ? "المساحة" : "Area"}</td>
          <td style="padding:6px 0;color:#1f2937;font-size:14px;text-align:${isAr ? "left" : "right"};">${propertyArea} m²</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#6b7280;font-size:13px;">${isAr ? "غرف النوم" : "Bedrooms"}</td>
          <td style="padding:6px 0;color:#1f2937;font-size:14px;text-align:${isAr ? "left" : "right"};">${propertyBedrooms}</td>
        </tr>
      </table>
    </div>

    <a href="${propertyUrl}"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "عرض العقار" : "View Property"}
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
    ? `عقار جديد: ${propertyTitle}\n\nالسعر: ${formatPrice(propertyPrice)}\nالمساحة: ${propertyArea} m²\nغرف: ${propertyBedrooms}\n\n${propertyUrl}`
    : `New listing: ${propertyTitle}\n\nPrice: ${formatPrice(propertyPrice)}\nArea: ${propertyArea} m²\nBedrooms: ${propertyBedrooms}\n\n${propertyUrl}`;

  return { subject, html, text };
}
