import type { Locale } from "@/i18n/config";

interface PropertyStatusChangeParams {
  locale: Locale;
  officeName: string;
  propertyTitle: string;
  oldStatus: string;
  newStatus: string;
}

const STATUS_LABELS: Record<string, { ar: string; en: string }> = {
  available: { ar: "متاح", en: "Available" },
  reserved: { ar: "محجوز", en: "Reserved" },
  sold: { ar: "تم البيع", en: "Sold" },
  rented: { ar: "تم الإيجار", en: "Rented" },
  pending_review: { ar: "قيد المراجعة", en: "Pending Review" },
};

const STATUS_COLORS: Record<string, string> = {
  available: "#22c55e",
  reserved: "#f59e0b",
  sold: "#ef4444",
  rented: "#8b5cf6",
  pending_review: "#6b7280",
};

export function propertyStatusChangeEmail(params: PropertyStatusChangeParams) {
  const { locale, officeName, propertyTitle, oldStatus, newStatus } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? `تم تغيير حالة العقار "${propertyTitle}"`
    : `Property status changed: "${propertyTitle}"`;

  const oldLabel = STATUS_LABELS[oldStatus]?.[locale] || oldStatus;
  const newLabel = STATUS_LABELS[newStatus]?.[locale] || newStatus;
  const newColor = STATUS_COLORS[newStatus] || "#6b7280";

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
      ${isAr ? "تغيير حالة العقار" : "Property Status Update"}
    </h2>
    <p style="color:#6b7280;font-size:14px;margin:0 0 24px;">
      ${isAr ? `مرحباً ${officeName}` : `Hello ${officeName}`}
    </p>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:13px;margin:0 0 4px;">${isAr ? "العقار" : "Property"}</p>
      <p style="color:#1f2937;font-size:16px;font-weight:600;margin:0 0 16px;">${propertyTitle}</p>

      <div style="display:flex;align-items:center;gap:12px;">
        <span style="background:#f3f4f6;color:#6b7280;padding:6px 12px;border-radius:6px;font-size:13px;">${oldLabel}</span>
        <span style="color:#9ca3af;font-size:18px;">→</span>
        <span style="background:${newColor}20;color:${newColor};padding:6px 12px;border-radius:6px;font-size:13px;font-weight:600;">${newLabel}</span>
      </div>
    </div>

    <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard/properties"
       style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
      ${isAr ? "إدارة العقارات" : "Manage Properties"}
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
    ? `تغيير حالة العقار\n\nالعقار: ${propertyTitle}\nالحالة السابقة: ${oldLabel}\nالحالة الجديدة: ${newLabel}`
    : `Property Status Update\n\nProperty: ${propertyTitle}\nPrevious status: ${oldLabel}\nNew status: ${newLabel}`;

  return { subject, html, text };
}
