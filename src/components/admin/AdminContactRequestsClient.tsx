"use client";

import { getMessages } from "@/i18n/getMessages";
import type { Locale } from "@/i18n/config";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { ROLES } from "@/lib/utils/constants";

export default function AdminContactRequestsClient({
  params,
}: {
  params?: { locale?: string };
}) {
  const locale = (params?.locale || "ar") as Locale;
  const dict = getMessages(locale);
  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.SUPER_ADMIN}>
      <Card>
        <div className="py-8 text-center text-gray-500">
          Legacy contact-request administration is temporarily unavailable while the Aqarat interaction workflow is being rebuilt.
        </div>
      </Card>
    </DashboardLayout>
  );
}
