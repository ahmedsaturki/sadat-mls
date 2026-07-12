"use client";

import Link from "next/link";
import { useCompare } from "@/hooks/useCompare";
import { getMessages } from "@/i18n/getMessages";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import Image from "next/image";
import { X, BarChart3, Ruler, Home } from "lucide-react";
import { type Locale } from "@/i18n/config";

const COLORS = ["#1B2D4F", "#C49A2A", "#22c55e", "#8b5cf6"];

export default function CompareClient({
  params,
}: {
  params: { locale: string };
}) {
  const typedLocale = params.locale as Locale;
  const dict = getMessages(typedLocale);
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const { properties, removeProperty, clearAll } = useCompare();

  const formatPrice = (price: number) =>
    new Intl.NumberFormat(typedLocale === "ar" ? "ar-EG" : "en-US").format(price);

  // Calculate comparison metrics
  const maxPrice = Math.max(...properties.map((p) => p.price || 0), 1);
  const maxArea = Math.max(...properties.map((p) => p.area || 0), 1);
  const maxBedrooms = Math.max(...properties.map((p) => p.bedrooms || 0), 1);

  if (properties.length === 0) {
    return (
      <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
        <div className="text-center py-16">
          <p className="text-lg text-gray-600 dark:text-gray-400">{dict.dashboard.noPropertiesForCompare}</p>
          <Link href={`/${typedLocale}/explore`} className="inline-block mt-4 text-navy-600 hover:text-navy-700 transition-colors">
            {dict.common.backToExplore || dict.common.back}
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{dict.dashboard.compareProperties}</h1>
          <button onClick={clearAll} className="px-4 py-2 text-red-600 hover:text-red-700 transition-colors">
            {dict.dashboard.clearAll}
          </button>
        </div>

        {/* Visual Comparison Charts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Price Comparison */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-navy-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dict.property.price}</h3>
            </div>
            <div className="space-y-3">
              {properties.map((p, i) => (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{p.title}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(p.price ?? 0)}</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${((p.price ?? 0) / maxPrice) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Area Comparison */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Ruler className="w-5 h-5 text-navy-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">{dict.property.area}</h3>
            </div>
            <div className="space-y-3">
              {properties.map((p, i) => (
                <div key={p.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{p.title}</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{p.area ?? 0} m²</span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${((p.area ?? 0) / maxArea) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Price per sqm Comparison */}
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-navy-500" />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {typedLocale === "ar" ? "السعر/م²" : "Price/m²"}
              </h3>
            </div>
            <div className="space-y-3">
              {properties.map((p, i) => {
                const pricePerSqm = (p.area ?? 0) > 0 ? (p.price ?? 0) / (p.area ?? 0) : 0;
                const allPricePerSqm = properties.map((pp) => ((pp.area ?? 0) > 0 ? (pp.price ?? 0) / (pp.area ?? 0) : 0));
                const maxPps = Math.max(...allPricePerSqm, 1);
                return (
                  <div key={p.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">{p.title}</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">{formatPrice(Math.round(pricePerSqm))}/m²</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(pricePerSqm / maxPps) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table */}
        <div className="overflow-x-auto bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <table className="w-full">
            <caption className="sr-only">{dict.dashboard.compareProperties}</caption>
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700">
                <th className="p-4 text-start w-40 text-sm font-medium text-gray-600 dark:text-gray-400" scope="col">{dict.common.feature}</th>
                {properties.map((p, i) => (
                  <th key={p.id} className="p-4 text-center min-w-[180px] relative" scope="col">
                    <button onClick={() => removeProperty(p.id)} className="absolute top-2 end-2 p-1 text-gray-500 hover:text-red-500 rounded" aria-label={`${dict.common.delete} ${p.title}`}>
                      <X className="w-4 h-4" />
                    </button>
                    {p.primaryImage && (
                      <div className="relative w-full h-24 mb-2 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
                        <Image src={p.primaryImage} alt={p.title} fill className="object-cover rounded-lg" sizes="(max-width: 768px) 100vw, 25vw" />
                      </div>
                    )}
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{p.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{p.officeName}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: dict.property.price, render: (p: typeof properties[0]) => <span className="font-semibold">{formatPrice(p.price ?? 0)} {dict.property.priceUnit}</span> },
                { label: dict.property.area, render: (p: typeof properties[0]) => `${p.area} ${dict.property.areaUnit}` },
                { label: dict.property.bedrooms, render: (p: typeof properties[0]) => p.bedrooms },
                { label: dict.property.bathrooms, render: (p: typeof properties[0]) => p.bathrooms },
                { label: dict.property.type, render: (p: typeof properties[0]) => p.type },
                { label: dict.property.zone, render: (p: typeof properties[0]) => p.zone },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-gray-100 dark:border-gray-700">
                  <th scope="row" className="p-4 font-medium text-start text-sm text-gray-600 dark:text-gray-400">{row.label}</th>
                  {properties.map((p) => (
                    <td key={p.id} className="p-4 text-center text-sm text-gray-900 dark:text-gray-100">{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
