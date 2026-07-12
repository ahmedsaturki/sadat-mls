"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Bookmark, Trash2, Search, Bell } from "lucide-react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMessages } from "@/i18n/getMessages";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useToast } from "@/components/ui/Toast";
import { logger } from "@/lib/logger";
import { getCsrfHeaders } from "@/lib/security/csrf-client";
import type { FilterState } from "@/components/properties/SearchFilters";
import { type Locale } from "@/i18n/config";

interface SavedSearch {
  id: string;
  name: string;
  filters: FilterState;
  last_checked_at: string | null;
  last_notified_at: string | null;
  created_at: string;
}

export default function SavedSearchesClient({
  params,
}: {
  params: { locale: string };
}) {
  const typedLocale = params.locale as Locale;
  const dict = getMessages(typedLocale);
  const { profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;
  const { showToast } = useToast();

  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const loadSearches = useCallback(async () => {
    try {
      const res = await fetch("/api/saved-searches");
      if (res.ok) {
        const data = await res.json();
        if (mountedRef.current) setSavedSearches(data.savedSearches || []);
      }
    } catch (err) {
      logger.error("Failed to load saved searches", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    loadSearches();
    return () => { mountedRef.current = false; };
  }, [loadSearches]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/saved-searches?id=${id}`, {
        method: "DELETE",
        headers: { ...getCsrfHeaders() },
      });
      if (res.ok) {
        setSavedSearches((prev) => prev.filter((s) => s.id !== id));
        showToast(dict.common.delete, "success");
      }
    } catch (err) {
      logger.error("Failed to delete saved search", { error: err instanceof Error ? err.message : String(err) });
    }
  };

  const handleCheck = async (searchId: string) => {
    setChecking(searchId);
    try {
      const res = await fetch("/api/saved-searches/check", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getCsrfHeaders() },
      });
      const data = await res.json();
      if (res.ok) {
        if (data.matches > 0) {
          showToast(`${data.matches} ${dict.dashboard.newPropertiesMatch}`, "success");
        } else {
          showToast(dict.dashboard.noNewProperties, "info");
        }
        loadSearches(); // Refresh to update last_checked_at
      }
    } catch (err) {
      logger.error("Failed to check saved searches", { error: err instanceof Error ? err.message : String(err) });
      showToast(dict.common.unexpectedError, "error");
    } finally {
      setChecking(null);
    }
  };

  const formatDate = useCallback((dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(typedLocale === "ar" ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [typedLocale]);

  const getActiveFiltersSummary = useCallback((filters: FilterState) => {
    const active: string[] = [];
    if (filters.search) active.push(filters.search);
    if (filters.zoneId) active.push(dict.explore.zone);
    if (filters.typeId) active.push(dict.explore.type);
    if (filters.minPrice || filters.maxPrice) active.push(dict.property.price);
    if (filters.minArea || filters.maxArea) active.push(dict.property.area);
    if (filters.bedrooms) active.push(`${dict.explore.bedrooms}: ${String(filters.bedrooms)}`);
    if (filters.bathrooms) active.push(`${dict.explore.bathrooms}: ${String(filters.bathrooms)}`);
    if (filters.hasBalcony) active.push(dict.explore.balcony);
    if (filters.hasParking) active.push(dict.explore.parking);
    if (filters.hasElevator) active.push(dict.explore.elevator);
    if (filters.developerId) active.push(dict.explore.developer);
    if (filters.projectId) active.push(dict.explore.project);
    if (filters.officeId) active.push(dict.explore.office);
    return active.length > 0 ? active.join(", ") : dict.explore.any;
  }, [dict]);

  const handleRunSearch = (filters: FilterState) => {
    const searchParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "" && value !== false) searchParams.set(key, String(value));
    });
    return `/${typedLocale}/explore?${searchParams.toString()}`;
  };

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bookmark className="w-6 h-6 text-navy-500" />
            {dict.dashboard.savedSearches}
          </h1>
          {savedSearches.length > 0 && (
            <button
              onClick={() => handleCheck("")}
              disabled={checking !== null}
              className="flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              {checking
                ? dict.dashboard.checking
                : dict.dashboard.checkNewMatches}
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : savedSearches.length === 0 ? (
          <div className="text-center py-16" role="status">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {dict.dashboard.noSavedSearchesFull || dict.dashboard.noSavedSearches}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              {dict.dashboard.saveSearchHint}
            </p>
            <Link
              href={`/${typedLocale}/explore`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 transition-colors text-sm font-medium"
            >
              <Search className="w-4 h-4" />
              {dict.common.search}
            </Link>
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
                    <h2 className="font-semibold text-gray-900 mb-2">{search.name}</h2>
                    <p className="text-sm text-gray-500 mb-3">
                      {getActiveFiltersSummary(search.filters)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {dict.common.createdAt}: {formatDate(search.created_at)}
                      {search.last_notified_at && (
                        <span className="ms-2">· {dict.dashboard.lastNotified}: {formatDate(search.last_notified_at)}</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={handleRunSearch(search.filters)}
                      className="px-4 py-2 text-sm font-medium text-navy-600 bg-navy-50 rounded-lg hover:bg-navy-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                    >
                      {dict.common.search}
                    </Link>
                    <button
                      onClick={() => handleDelete(search.id)}
                      className="p-2 text-gray-500 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
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
