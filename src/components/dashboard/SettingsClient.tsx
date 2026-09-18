"use client";

import { getMessages } from "@/i18n/getMessages";
import type { Locale } from "@/i18n/config";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { ROLES } from "@/lib/utils/constants";

export default function SettingsClient({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale as Locale;
  const dict = getMessages(locale);

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.OFFICE_AGENT}>
      <Card>
        <div className="space-y-3 py-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
          <p className="text-gray-500">
            Account settings are temporarily unavailable while the verified Aqarat identity contract is being established.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
}
