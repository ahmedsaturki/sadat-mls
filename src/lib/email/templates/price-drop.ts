import type { Locale } from "@/i18n/config";

interface PriceDropParams {
  locale: Locale;
  propertyTitle: string;
  oldPrice: number;
  newPrice: number;
  propertyUrl: string;
}

export function priceDropEmail(params: PriceDropParams) {
  const { locale, propertyTitle, oldPrice, newPrice, propertyUrl } = params;
  const isAr = locale === "ar";

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(isAr ? "ar-EG" : "en-US").format(price) + " EGP";

  const dropAmount = oldPrice - newPrice;
  const dropPercent = ((dropAmount / oldPrice) * 100).toFixed(0);

  const subject = isAr
    ? `انخفاض السعر: ${propertyTitle} - خصم ${dropPercent}%`
    : `Price Drop: ${propertyTitle} - ${dropPercent}% off`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";
  const fullUrl = `${siteUrl}${propertyUrl}`;

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1B2D4F;padding:24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:20px;">Aqar Cloud</h1>
  </div>
  <div style="padding:32px 24px;">
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:16px;text-align:center;margin-bottom:24px;">
      <p style="color:#dc2626;font-size:14px;margin:0;font-weight:600;">
        ${isAr ? "انخفاض السعر" : "PRICE DROP"}
      </p>
      <p style="color:#dc2626;font-size:28px;font-weight:700;margin:8px 0 0;">
        -${dropPercent}%
      </p>
    </div>

    <h2 style="color:#1B2D4F;margin:0 0 8px;font-size:18px;">${propertyTitle}</h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? "سعر العقار انخفض:" : "The property price has dropped:"}
    </p>

    <div style="display:flex;justify-content:center;gap:24px;margin-bottom:24px;">
      <div style="text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">${isAr ? "السعر السابق" : "Old Price"}</p>
        <p style="color:#6b7280;font-size:16px;text-decoration:line-through;margin:0;">${formatPrice(oldPrice)}</p>
      </div>
      <div style="text-align:center;">
        <p style="color:#9ca3af;font-size:12px;margin:0 0 4px;">${isAr ? "السعر الجديد" : "New Price"}</p>
        <p style="color:#dc2626;font-size:20px;font-weight:700;margin:0;">${formatPrice(newPrice)}</p>
      </div>
    </div>

    <a href="${fullUrl}"
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
    ? `انخفاض السعر: ${propertyTitle}\n\nالسعر السابق: ${formatPrice(oldPrice)}\nالسعر الجديد: ${formatPrice(newPrice)}\nخصم: ${dropPercent}%\n\nعرض العقار: ${fullUrl}`
    : `Price Drop: ${propertyTitle}\n\nOld Price: ${formatPrice(oldPrice)}\nNew Price: ${formatPrice(newPrice)}\nDiscount: ${dropPercent}%\n\nView Property: ${fullUrl}`;

  return { subject, html, text };
}
