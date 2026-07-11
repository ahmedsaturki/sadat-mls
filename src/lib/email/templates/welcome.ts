import type { Locale } from "@/i18n/config";

interface WelcomeEmailParams {
  locale: Locale;
  userName: string;
  officeName?: string;
}

export function welcomeEmail(params: WelcomeEmailParams) {
  const { locale, userName, officeName } = params;
  const isAr = locale === "ar";

  const subject = isAr
    ? "مرحباً بك في Aqar Cloud"
    : "Welcome to Aqar Cloud";

  const officeLine = officeName
    ? (isAr ? `<p style="color:#6b7280;font-size:14px;margin:0 0 8px;">لقد انضممت إلى <strong>${officeName}</strong></p>` : `<p style="color:#6b7280;font-size:14px;margin:0 0 8px;">You've joined <strong>${officeName}</strong></p>`)
    : "";

  const html = `<!DOCTYPE html>
<html lang="${locale}" dir="${isAr ? "rtl" : "ltr"}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:600px;margin:0 auto;background:#ffffff;">
  <div style="background:#1B2D4F;padding:32px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:24px;">Aqar Cloud</h1>
    <p style="color:#C49A2A;margin:8px 0 0;font-size:14px;">${isAr ? "منصة العقارات السحابية" : "Cloud Real Estate Platform"}</p>
  </div>
  <div style="padding:32px 24px;">
    <h2 style="color:#1B2D4F;margin:0 0 16px;font-size:20px;">
      ${isAr ? `مرحباً ${userName}!` : `Welcome ${userName}!`}
    </h2>
    ${officeLine}
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:0 0 24px;">
      ${isAr
        ? "يسعدنا انضمامك إلى منصة Aqar Cloud. يمكنك الآن استكشاف العقارات، إدارة listings الخاصة بك، والتواصل مع المكاتب العقارية الأخرى."
        : "We're glad to have you on Aqar Cloud. You can now explore properties, manage your listings, and connect with other real estate offices."
      }
    </p>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/explore"
         style="display:inline-block;background:#1B2D4F;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">
        ${isAr ? "استكشاف العقارات" : "Explore Properties"}
      </a>
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/dashboard"
         style="display:inline-block;background:#ffffff;color:#1B2D4F;padding:12px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;border:1px solid #e5e7eb;">
        ${isAr ? "لوحة التحكم" : "Dashboard"}
      </a>
    </div>

    <div style="background:#f9fafb;border-radius:12px;padding:20px;">
      <h3 style="color:#1B2D4F;margin:0 0 12px;font-size:15px;">
        ${isAr ? "الخطوات التالية" : "Next Steps"}
      </h3>
      <ul style="color:#6b7280;font-size:13px;line-height:2;padding:0;margin:0;${isAr ? "padding-right:20px;" : "padding-left:20px;"}">
        <li>${isAr ? "أكمل ملف المكتب الخاص بك" : "Complete your office profile"}</li>
        <li>${isAr ? "أضف أولى عقاراتك" : "Add your first property"}</li>
        <li>${isAr ? "ادعُ مندوبين للانضمام لفريقك" : "Invite agents to join your team"}</li>
      </ul>
    </div>
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
    ? `مرحباً ${userName}!\n\n${officeName ? `لقد انضممت إلى ${officeName}\n\n` : ""}يسعدنا انضمامك إلى منصة Aqar Cloud.\n\nالخطوات التالية:\n- أكمل ملف المكتب\n- أضف أولى عقاراتك\n- ادعُ مندوبين للانضمام`
    : `Welcome ${userName}!\n\n${officeName ? `You've joined ${officeName}\n\n` : ""}We're glad to have you on Aqar Cloud.\n\nNext Steps:\n- Complete your office profile\n- Add your first property\n- Invite agents to join your team`;

  return { subject, html, text };
}
