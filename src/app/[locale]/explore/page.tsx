"use client";

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Home, ArrowUpDown } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { usePageLocale } from "@/hooks/usePageLocale";
import PropertyCard from "@/components/properties/PropertyCard";
import type { FilterState } from "@/components/properties/SearchFilters";
import { EMPTY_FILTERS } from "@/components/properties/SearchFilters";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Database } from "@/lib/supabase/types";
import type { PropertyStatus } from "@/lib/utils/constants";
import Navbar from "@/components/layout/Navbar";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const SearchFilters = lazy(() => import("@/components/properties/SearchFilters"));

type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_types: { name_ar: string } | null;
  zones: { name_ar: string } | null;
  offices: { name: string } | null;
  primaryImage?: string | null;
  status: PropertyStatus;
};

const PAGE_SIZE = 12;

let cachedActiveOfficeIds: Set<string> | null = null;

type SupabaseQueryParams = {
  data: Property[];
  count?: number;
};

function ExploreContent({
  params,
}: {
  params: { locale: string };
}) {
  const locale = usePageLocale(params);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [zones, setZones] = useState<{ id: string; name: string }[]>([]);
  const [types, setTypes] = useState<{ id: string; name: string }[]>([]);
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "area">("newest");
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    search: searchParams.get("q") || "",
  });

  const dict = getMessages(locale);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasMore = page < totalPages;

  const mountedRef = useRef(true);

  const loadZonesAndTypes = useCallback(async () => {
    if (!mountedRef.current) return;
    const supabase = createClient();
    try {
      const [{ data: zonesData }, { data: typesData }] = await Promise.all([
        supabase.from("zones").select("id, name_ar, name_en"),
        supabase.from("property_types").select("id, name_ar, name_en"),
      ]);
      setZones((zonesData || []).map((z: { id: string; name_ar: string; name_en: string }) => ({ id: z.id, name: locale === "ar" ? z.name_ar : (z.name_en || z.name_ar) })));
      setTypes((typesData || []).map((t: { id: string; name_ar: string; name_en: string }) => ({ id: t.id, name: locale === "ar" ? t.name_ar : (t.name_en || t.name_ar) })));
    } catch (err) {
      logger.error("Failed to load zones/types", { error: err instanceof Error ? err.message : "Unknown" });
    }
  }, [locale]);

  const loadProperties = useCallback(async (currentFilters?: FilterState, append = false) => {
    if (!mountedRef.current) return;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const f = currentFilters || filters;
      const retryWithBackoff = async (fn: () => Promise<SupabaseQueryParams>, retries = 3): Promise<SupabaseQueryParams> => {
        for (let i = 0; i < retries; i++) {
          try {
            const result = await fn();
            return { data: result.data || [], count: result.count };
          } catch (err) {
            const error = err as { code?: string };
            if (error?.code === "over_request_rate_limit" && i < retries - 1) {
              await new Promise(r => setTimeout(r, 500 * Math.pow(2, i)));
              continue;
            }
            throw err;
          }
        }
        return { data: [], count: 0 };
      };

const result = await retryWithBackoff(async (): Promise<SupabaseQueryParams> => {
         let query = supabase
           .from("properties")
           .select("*, property_types(name_ar), zones(name_ar), offices(name)", { count: "exact" })
           .eq("status", "available")
           .eq("is_active", true);

        switch (sortBy) {
          case "newest": query = query.order("created_at", { ascending: false }); break;
          case "price_low": query = query.order("price", { ascending: true }); break;
          case "price_high": query = query.order("price", { ascending: false }); break;
          case "area": query = query.order("area", { ascending: false }); break;
        }

        if (f.zoneId) query = query.eq("zone_id", f.zoneId);
        if (f.typeId) query = query.eq("property_type_id", f.typeId);
        if (f.minPrice) query = query.gte("price", Number(f.minPrice));
        if (f.maxPrice) query = query.lte("price", Number(f.maxPrice));
        if (f.minArea) query = query.gte("area", Number(f.minArea));
        if (f.maxArea) query = query.lte("area", Number(f.maxArea));
        if (f.bedrooms) query = query.gte("bedrooms", Number(f.bedrooms));
        if (f.bathrooms) query = query.gte("bathrooms", Number(f.bathrooms));
        if (f.hasBalcony) query = query.eq("has_balcony", true);
        if (f.hasParking) query = query.eq("has_parking", true);
        if (f.hasElevator) query = query.eq("has_elevator", true);
        if (f.search) query = query.ilike("title", `%${f.search}%`);

        const from = (page - 1) * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;
        const { data, count, error: queryError } = await query.range(from, to);

        if (queryError) throw queryError;
        return { data: data || [], count };
      });

      const { data, count } = result;

      if (data) {
        const propertyIds = data.map((p: Property) => p.id);

        const getActiveOfficeIds = async (): Promise<Set<string>> => {
          if (cachedActiveOfficeIds) return cachedActiveOfficeIds;
          const { data: officesData } = await supabase.from("offices").select("id").eq("is_active", true);
          cachedActiveOfficeIds = new Set((officesData as { id: string }[] | null)?.map((o) => o.id) || []);
          return cachedActiveOfficeIds;
        };

        const [activeOfficeIds, imagesResult] = await Promise.all([
          getActiveOfficeIds(),
          supabase.from("property_images").select("property_id, url").in("property_id", propertyIds).eq("is_primary", true),
        ]);

        let filtered = data.filter((p: Property) => p.office_id && activeOfficeIds.has(p.office_id));

        if (f.search) {
          const search = f.search.toLowerCase();
          filtered = filtered.filter((p: Property) =>
            p.title.toLowerCase().includes(search) ||
            p.description?.toLowerCase().includes(search)
          );
        }

        const imageMap = new Map((imagesResult.data as { property_id: string; url: string }[] | null)?.map((img) => [img.property_id, img.url]) || []);
        const withImages = filtered.map((p: Property) => ({
          ...p,
          status: p.status as PropertyStatus,
          primaryImage: imageMap.get(p.id) || null,
        }));

        if (append) {
          setProperties(prev => [...prev, ...withImages]);
        } else {
          setProperties(withImages);
        }
        setTotalCount(count || 0);
      }
    } catch (err) {
      logger.error("Failed to load properties", { error: err instanceof Error ? err.message : "Unknown" });
      setError(dict.common.unexpectedError);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [filters, sortBy, page, dict.common.unexpectedError]);

  useEffect(() => {
    mountedRef.current = true;
    if (locale) loadProperties();
    return () => { mountedRef.current = false; };
  }, [page, sortBy, locale, loadProperties]);

  // Initialize on mount
  useEffect(() => {
    loadZonesAndTypes();
  }, [loadZonesAndTypes]);

  const loadMore = useCallback(() => {
    setPage(prev => prev + 1);
  }, []);

  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    loading: loadingMore,
    onLoadMore: loadMore,
  });

  const handleSearch = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
    setShowFilters(false);
  }, []);

  const handleSortChange = useCallback((newSort: typeof sortBy) => {
    setSortBy(newSort);
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setPage(1);
  }, []);

  const hasActiveFilters = filters.zoneId || filters.typeId || filters.minPrice || filters.maxPrice ||
    filters.minArea || filters.maxArea || filters.bedrooms || filters.bathrooms ||
    filters.hasBalcony || filters.hasParking || filters.hasElevator;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">{dict.explore.title}</h1>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full"
                >
                  <X className="w-4 h-4" />
                  {dict.explore.clearFilters}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  aria-label={dict.property.sortNewest}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="newest">{dict.property.sortNewest}</option>
                  <option value="price_low">{dict.property.sortPriceLow}</option>
                  <option value="price_high">{dict.property.sortPriceHigh}</option>
                  <option value="area">{dict.property.sortArea}</option>
                </select>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors ${
                  showFilters ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                }`}
                aria-label={dict.common.filters}
                aria-expanded={showFilters}
              >
                <SlidersHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Filters */}
        {showFilters && (
          <div className="mb-6">
            <SearchFilters
              dict={dict}
              zones={zones}
              types={types}
              onSearch={handleSearch}
            />
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{error}</h3>
            <button
              onClick={() => loadProperties()}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              {dict.common.retry}
            </button>
          </div>
        ) : properties.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {totalCount} {dict.explore.results}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {properties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  price={property.price}
                  area={property.area}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  zone={property.zones?.name_ar}
                  imageUrl={property.primaryImage || undefined}
                  status={property.status}
                  officeName={property.offices?.name || ""}
                  locale={locale}
                  type={property.property_types?.name_ar}
                  dict={dict}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={`loading-${i}`} />
                ))}
              </div>
            )}

            {/* End of results */}
            {!hasMore && properties.length > 0 && (
              <p className="text-center text-sm text-gray-400 mt-8">
                {dict.common.allResultsLoaded}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{dict.explore.noResults || dict.explore.noProperties}</h3>
            <p className="text-sm text-gray-500">{dict.explore.tryDifferentSearch}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage({
  params,
}: {
  params: { locale: string };
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }>
        <ExploreContent params={params} />
      </Suspense>
    </ErrorBoundary>
  );
}
