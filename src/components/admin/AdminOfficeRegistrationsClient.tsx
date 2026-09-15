"use client";

import { getMessages } from "@/i18n/getMessages";
import type { Locale } from "@/i18n/config";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { ROLES } from "@/lib/utils/constants";

export default function AdminOfficeRegistrationsClient({
  locale: rawLocale = "ar",
}: {
  locale?: string;
  [key: string]: unknown;
}) {
  const locale = rawLocale as Locale;
  const dict = getMessages(locale);
  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <Card><div className="py-8 text-center text-gray-500">Office registration administration is temporarily unavailable pending a verified Aqarat organization workflow.</div></Card>
    </DashboardLayout>
  );
}
