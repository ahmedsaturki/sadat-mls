"use client";

import { useCallback } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import { useSavedSearches } from "@/hooks/useSavedSearches";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import type { FilterState } from "@/components/properties/SearchFilters";

function SavedSearchesContent({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const dict = getMessages(locale);
  const { savedSearches, removeSavedSearch, count, clearAll } = useSavedSearches();
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [locale]);

  const getActiveFiltersSummary = useCallback((filters: FilterState) => {
    const active: string[] = [];
    if (filters.zoneId) active.push(dict.explore.zone);
    if (filters.typeId) active.push(dict.explore.type);
    if (filters.minPrice || filters.maxPrice) active.push(dict.property.price);
    if (filters.minArea || filters.maxArea) active.push(dict.property.area);
    if (filters.bedrooms) active.push(`${dict.explore.bedrooms}: ${String(filters.bedrooms)}`);
    if (filters.bathrooms) active.push(`${dict.explore.bathrooms}: ${String(filters.bathrooms)}`);
    if (filters.hasBalcony) active.push(dict.explore.balcony);
    if (filters.hasParking) active.push(dict.explore.parking);
    if (filters.hasElevator) active.push(dict.explore.elevator);
    return active.length > 0 ? active.join(", ") : dict.explore.any;
  }, [dict]);

  const handleRunSearch = (filters: FilterState) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, String(value));
    });
    return `/${locale}/explore?${params.toString()}`;
  };

  return (
    <DashboardLayout locale={locale} dict={dict} role={userRole}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-blue-500" />
            {dict.dashboard.savedSearches}
          </h1>
          {count > 0 && (
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded"
            >
              <Trash2 className="w-4 h-4" />
              {dict.explore.clearAll}
            </button>
          )}
        </div>

        {savedSearches.length === 0 ? (
          <div className="text-center py-16" role="status">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {dict.dashboard.noSavedSearchesFull}
            </h3>
            <p className="text-sm text-gray-500">
              {dict.dashboard.saveSearchHint}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-2">{search.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">
                      {getActiveFiltersSummary(search.filters)}
                    </p>
<p className="text-xs text-gray-400">
                       {dict.dashboard.created} {formatDate(search.createdAt)}
                       {search.lastNotified && (
                         <span className="ms-2">• {dict.dashboard.lastChecked} {formatDate(search.lastNotified)}</span>
                       )}
                     </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={handleRunSearch(search.filters)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                    >
                      {dict.dashboard.runSearch || dict.common.search}
                    </Link>
                    <button
                      onClick={() => removeSavedSearch(search.id)}
                      className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      aria-label={dict.common.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default function SavedSearchesPageWrapper(props: { params: { locale: string } }) {
  return (
    <ErrorBoundary>
      <SavedSearchesContent {...props} />
    </ErrorBoundary>
  );
}