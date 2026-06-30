"use client";

import PropertyForm from "@/components/properties/PropertyForm";
import { usePageLocale } from "@/hooks/usePageLocale";

export default function EditPropertyPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = usePageLocale(params);
  return <PropertyForm mode="edit" locale={locale} propertyId={params.id} />;
}
