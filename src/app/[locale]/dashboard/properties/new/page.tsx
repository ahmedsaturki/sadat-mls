"use client";

import { Suspense, lazy } from "react";
import { usePageLocale } from "@/hooks/usePageLocale";
import { LuxuryLoader } from "@/components/ui/LuxuryLoader";

const PropertyForm = lazy(() => import("@/components/properties/PropertyForm"));

export default function NewPropertyPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);

  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><LuxuryLoader /></div>}>
      <PropertyForm mode="create" locale={locale} />
    </Suspense>
  );
}
