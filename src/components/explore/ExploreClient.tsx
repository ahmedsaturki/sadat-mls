"use client";

import { useState, useEffect, useCallback, useRef, Suspense, lazy } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, X, Home, ArrowUpDown } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/client";
import { logger } from "@/lib/logger";
import { withRetry } from "@/lib/utils/retry";
import { usePageLocale } from "@/hooks/usePageLocale";
import PropertyCard from "@/components/properties/PropertyCard";
import type { FilterState } from "@/components/properties/SearchFilters";
import { EMPTY_FILTERS } from "@/components/properties/SearchFilters";
import { SkeletonCard } from "@/components/ui/Skeleton";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { PropertyStatus } from "@/lib/utils/constants";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ErrorBoundary from "@/components/ui/ErrorBoundary";

const SearchFilters = lazy(() => import("@/components/properties/SearchFilters"));

interface PropertyRow {
  id: string;
  title: string;
  description: string | null;
  street: string | null;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: PropertyStatus;
  zone_id: string | null;
  property_type_id: string | null;
  office_id: string;
  property_types: { name_ar: string; name_en: string | null } | null;
  zones: { name_ar: string; name_en: string | null } | null;
  offices: { name: string } | null;
}

type Property = PropertyRow & {
  primaryImage?: string | null;
};

const PAGE_SIZE = 12;
const PROPERTY_COLUMNS = "id, title, description, price, area, bedrooms, bathrooms, status, zone_id, property_type_id, office_id, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name)";

interface ExploreClientProps {
  params: { locale: string };
  initialProperties: Property[];
  initialCount: number;
  initialZones: { id: string; name: string }[];
  initialTypes: { id: string; name: string }[];
}

function ExploreClientInner({
  params,
  initialProperties,
  initialCount,
  initialZones,
  initialTypes,
}: ExploreClientProps) {
  const locale = usePageLocale(params);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(initialCount);
  const [zones, setZones] = useState<{ id: string; name: string }[]>(initialZones);
  const [types, setTypes] = useState<{ id: string; name: string }[]>(initialTypes);
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "area">("newest");
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<FilterState>({
    ...EMPTY_FILTERS,
    search: searchParams.get("q") || "",
  });
  const [initialLoaded, setInitialLoaded] = useState(true);

  const dict = getMessages(locale);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const hasMore = page < totalPages;

  const mountedRef = useRef(true);
  const supabaseRef = useRef(createClient());

  const loadProperties = useCallback(async (currentFilters?: FilterState, append = false) => {
    if (!mountedRef.current) return;
    if (append) setLoadingMore(true);
    else setLoading(true);
    setError(null);

    try {
      const supabase = supabaseRef.current;
      const f = currentFilters || filters;

      let query = supabase
        .from("properties")
        .select(PROPERTY_COLUMNS, { count: "exact" })
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
      if (f.search) {
        query = query.textSearch("fts", f.search, { type: "websearch", config: "arabic" });
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const result = await withRetry(
        () => query.range(from, to),
        { maxRetries: 3, retryOn: (err) => (err as { code?: string })?.code === "over_request_rate_limit" }
      );
      const { data, count, error: queryError } = result as { data: PropertyRow[] | null; count: number | null; error: unknown };

      if (queryError) throw queryError;

      if (data) {
        const propertyIds = data.map((p: PropertyRow) => p.id);
        const { data: imagesResult } = await supabase
          .from("property_images")
          .select("property_id, url")
          .in("property_id", propertyIds)
          .eq("is_primary", true);

        const imageMap = new Map(
          (imagesResult as { property_id: string; url: string }[] | null)?.map(
            (img) => [img.property_id, img.url]
          ) || []
        );

        const withImages = data.map((p: PropertyRow) => ({
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
      setInitialLoaded(false);
    }
  }, [filters, sortBy, page, dict.common.unexpectedError]);

  // Skip initial client-side fetch if server already provided data
  useEffect(() => {
    mountedRef.current = true;
    if (initialLoaded) {
      setInitialLoaded(false);
      return;
    }
    loadProperties();
    return () => { mountedRef.current = false; };
  }, [page, sortBy, loadProperties, initialLoaded]);

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
    <main className="min-h-screen bg-gray-50">
      <a href="#explore-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-navy-600 focus:ring-2 focus:ring-navy-500">
        {dict.common.skipToContent}
      </a>
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
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  {dict.explore.clearFilters}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <label htmlFor="sort-select" className="sr-only">{dict.property.sortBy}</label>
                <ArrowUpDown className="w-4 h-4 text-gray-500" aria-hidden="true" />
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value as typeof sortBy)}
                  aria-label={dict.property.sortNewest}
                  className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 bg-white"
                >
                  <option value="newest">{dict.property.sortNewest}</option>
                  <option value="price_low">{dict.property.sortPriceLow}</option>
                  <option value="price_high">{dict.property.sortPriceHigh}</option>
                  <option value="area">{dict.property.sortArea}</option>
                </select>
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                  showFilters ? "bg-navy-100 text-navy-600" : "bg-gray-100 text-gray-600"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6" id="explore-content" tabIndex={-1}>
        {/* Filters */}
        {showFilters && (
          <div className="mb-6">
            <SearchFilters
              dict={dict as unknown as { common: Record<string, string>; explore: Record<string, string> }}
              zones={zones}
              types={types}
              onSearch={handleSearch}
            />
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-live="polite">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16" role="alert">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-500" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">{error}</h2>
            <button
              onClick={() => loadProperties()}
              className="text-navy-600 hover:text-navy-700 font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 rounded"
            >
              {dict.common.retry}
            </button>
          </div>
        ) : properties.length > 0 ? (
          <>
            <p className="text-sm text-gray-500 mb-4" aria-live="polite">
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
                  zone={locale === "ar" ? property.zones?.name_ar : (property.zones?.name_en ?? undefined)}
                  imageUrl={property.primaryImage || undefined}
                  status={property.status}
                  officeName={property.offices?.name || ""}
                  locale={locale}
                  type={locale === "ar" ? property.property_types?.name_ar : (property.property_types?.name_en ?? undefined)}
                  dict={dict}
                />
              ))}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" aria-hidden="true" />

            {loadingMore && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <SkeletonCard key={`loading-${i}`} />
                ))}
              </div>
            )}

            {!hasMore && properties.length > 0 && (
              <p className="text-center text-sm text-gray-400 mt-8">
                {dict.common.allResultsLoaded}
              </p>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-8 h-8 text-gray-400" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">{dict.explore.noResults || dict.explore.noProperties}</h2>
            <p className="text-sm text-gray-500">{dict.explore.tryDifferentSearch}</p>
          </div>
        )}
      </div>

      <Footer locale={locale} dict={dict} />
    </main>
  );
}

export default function ExploreClient(props: ExploreClientProps) {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
        </div>
      }>
        <ExploreClientInner {...props} />
      </Suspense>
    </ErrorBoundary>
  );
}
