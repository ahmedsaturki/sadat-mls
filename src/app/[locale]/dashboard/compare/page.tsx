"use client";

import { useCompare } from "@/hooks/useCompare";
import { useParams } from "next/navigation";
import { getMessages } from "@/i18n/getMessages";
import type { Locale } from "@/i18n/config";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import Image from "next/image";

export default function ComparePage() {
  const params = useParams();
  const locale = params.locale as Locale;
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
          <a
            href={`/${locale}/explore`}
            className="inline-block mt-4 text-blue-600 hover:text-blue-700"
          >
            {dict.common.backToExplore || dict.common.back}
          </a>
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
            className="px-4 py-2 text-red-600 hover:text-red-700"
          >
            {dict.dashboard.clearAll}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full bg-white rounded-xl shadow-sm">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left w-40">
                  {dict.common.feature}
                </th>
                {properties.map((p) => (
                  <th key={p.id} className="p-4 text-center min-w-[200px] relative">
                    <button
                      onClick={() => removeProperty(p.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
                      aria-label={`${dict.common.delete} ${p.title}`}
                    >
                      ×
                    </button>
                    {p.imageUrl && (
                      <div className="relative w-full h-32 mb-2">
                        <Image src={p.imageUrl} alt={p.title} fill className="object-cover rounded-lg" />
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
                <td className="p-4 font-medium">{dict.property.price}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 text-center font-bold text-blue-600">
                    {p.price?.toLocaleString()} {dict.property.priceUnit}
                  </td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{dict.property.area}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 text-center">{p.area} {dict.property.areaUnit}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{dict.property.bedrooms}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 text-center">{p.bedrooms}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{dict.property.bathrooms}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 text-center">{p.bathrooms}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{dict.property.type}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 text-center">{p.type}</td>
                ))}
              </tr>
              <tr className="border-b">
                <td className="p-4 font-medium">{dict.property.zone}</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-4 text-center">{p.zone}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}