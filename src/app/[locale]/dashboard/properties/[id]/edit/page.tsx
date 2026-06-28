"use client";

import { useState, useEffect } from "react";
import PropertyForm from "@/components/properties/PropertyForm";
import { usePageLocale } from "@/hooks/usePageLocale";

export default function EditPropertyPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const locale = usePageLocale(params);
  const [propertyId, setPropertyId] = useState<string>("");

  useEffect(() => {
    setPropertyId(params.id);
  }, [params]);

  if (!propertyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return <PropertyForm mode="edit" locale={locale} propertyId={propertyId} />;
}
