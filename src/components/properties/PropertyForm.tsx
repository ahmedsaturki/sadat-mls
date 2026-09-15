"use client";

import type { Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Card from "@/components/ui/Card";
import { ROLES } from "@/lib/utils/constants";

interface PropertyFormProps {
  mode: "create" | "edit";
  locale: Locale;
  propertyId?: string;
}

export default function PropertyForm({ locale, mode: _mode, propertyId: _propertyId }: PropertyFormProps) {
  const dict = getMessages(locale);

  return (
    <DashboardLayout locale={locale} dict={dict} role={ROLES.OFFICE_AGENT}>
      <Card>
        <div className="space-y-3 py-8 text-center">
          <h1 className="text-xl font-semibold text-gray-900">{dict.office?.addProperty || "Property management"}</h1>
          <p className="text-gray-500">
            Property write operations are temporarily unavailable while the Aqarat OS write contract is being rebuilt and verified.
          </p>
        </div>
      </Card>
    </DashboardLayout>
  );
}
