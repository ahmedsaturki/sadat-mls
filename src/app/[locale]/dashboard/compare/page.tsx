"use client";

import Link from "next/link";
import { useCompare } from "@/hooks/useCompare";
import { usePageLocale } from "@/hooks/usePageLocale";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import Image from "next/image";
import { X } from "lucide-react";

function CompareContent({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const dict = getMessages(locale);
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const { properties, removeProperty, clearAll } = useCompare();

  if (properties.length === 0) {
    return (
      <DashboardLayout locale={locale} dict={dict} role={userRole}>
        <div className="text-center py-16">
          <p className="text-lg text-gray-600">
            {dict.dashboard.noPropertiesForCompare}
          </p>
          <Link
            href={`/${locale}/explore`}
            className="inline-block mt-4 text-navy-600 hover:text-navy-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
          >
            {dict.common.backToExplore || dict.common.back}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">
            {dict.dashboard.compareProperties}
          </h1>
          <button
            onClick={clearAll}
            className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
          >
            {dict.dashboard.clearAll}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm">
            <caption className="sr-only">{dict.dashboard.compareProperties}</caption>
            <thead>
    <tr className="border-b">
      <th className="p-4 text-start w-40" scope="col">
        <p className="text-sm font-medium text-gray-600">
          {dict.common.feature}
        </p>
      </th>
      {properties.map((p) => (
        <th key={p.id} className="p-4 text-center min-w-[200px] relative" scope="col">
          <button
            onClick={() => removeProperty(p.id)}
            className="absolute top-2 end-2 p-1 text-gray-400 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
            aria-label={`${dict.common.delete} ${p.title}`}
          >
            <X className="w-4 h-4" />
          </button>
          {p.primaryImage && (
            <div className="relative w-full h-32 mb-2 bg-gray-50 rounded">
              <Image src={p.primaryImage} alt={p.title} fill className="object-cover rounded-lg" sizes="(max-width: 768px) 100vw, 25vw" />
            </div>
          )}
          <p className="font-semibold">{p.title}</p>
          <p className="text-sm text-gray-500">{p.officeName}</p>
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    <tr className="border-b">
      <th scope="row" className="p-4 font-medium text-start">
        {dict.property.price}
      </th>
      {properties.map((p) => (
        <td key={p.id} className="p-4 text-center">
          {p.price?.toLocaleString(locale === "ar" ? "ar-EG" : "en-US")} {dict.property.priceUnit}
        </td>
      ))}
    </tr>
    <tr className="border-b">
      <th scope="row" className="p-4 font-medium text-start">
        {dict.property.area}
      </th>
      {properties.map((p) => (
        <td key={p.id} className="p-4 text-center">
          {p.area} {dict.property.areaUnit}
        </td>
      ))}
    </tr>
    <tr className="border-b">
      <th scope="row" className="p-4 font-medium text-start">
        {dict.property.bedrooms}
      </th>
      {properties.map((p) => (
        <td key={p.id} className="p-4 text-center">
          {p.bedrooms}
        </td>
      ))}
    </tr>
    <tr className="border-b">
      <th scope="row" className="p-4 font-medium text-start">
        {dict.property.bathrooms}
      </th>
      {properties.map((p) => (
        <td key={p.id} className="p-4 text-center">
          {p.bathrooms}
        </td>
      ))}
    </tr>
    <tr className="border-b">
      <th scope="row" className="p-4 font-medium text-start">
        {dict.property.type}
      </th>
      {properties.map((p) => (
        <td key={p.id} className="p-4 text-center">
          {p.type}
        </td>
      ))}
    </tr>
    <tr className="border-b">
      <th scope="row" className="p-4 font-medium text-start">
        {dict.property.zone}
      </th>
      {properties.map((p) => (
        <td key={p.id} className="p-4 text-center">
          {p.zone}
        </td>
      ))}
    </tr>
  </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function ComparePage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <ErrorBoundary>
      <CompareContent params={params} />
    </ErrorBoundary>
  );
}