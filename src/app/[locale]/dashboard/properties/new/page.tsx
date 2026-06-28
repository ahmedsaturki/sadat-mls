"use client";

import PropertyForm from "@/components/properties/PropertyForm";
import { usePageLocale } from "@/hooks/usePageLocale";

export default function NewPropertyPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);

  return <PropertyForm mode="create" locale={locale} />;
}
