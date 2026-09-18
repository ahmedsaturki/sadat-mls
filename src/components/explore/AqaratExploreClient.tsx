"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpDown, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import { getMessages } from "@/i18n/getMessages";
import { createClient } from "@/lib/supabase/client";
import type { AqaratPropertyRow } from "@/lib/supabase/aqarat-types";
import { logger } from "@/lib/logger";
import PropertyCard from "@/components/properties/PropertyCard";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export type AqaratProperty = AqaratPropertyRow;

interface Props {
  params: { locale: string };
  initialProperties: AqaratProperty[];
  initialCount: number;
}

const COLUMNS =
  "id,title,description,property_type,transaction_type,status,city,district,neighborhood,address,latitude,longitude,area_m2,bedrooms,bathrooms,floor,finishing,price,currency,features,confidence,first_seen_at,last_seen_at,created_at,updated_at,parcel_number,installments_clear,canonical_key" as const;

export default function AqaratExploreClient({ params, initialProperties, initialCount }: Props) {
  const locale = params.locale as "ar" | "en";
  const dict = getMessages(locale);
  const searchParams = useSearchParams();
  const clientRef = useRef(createClient());
  const [properties, setProperties] = useState<AqaratProperty[]>(initialProperties);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [queryText, setQueryText] = useState(searchParams.get("q") ?? "");
  const [propertyType, setPropertyType] = useState(searchParams.get("type") ?? "");
  const [district, setDistrict] = useState(searchParams.get("district") ?? "");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [minArea, setMinArea] = useState(searchParams.get("minArea") ?? "");
  const [maxArea, setMaxArea] = useState(searchParams.get("maxArea") ?? "");
  const [sortBy, setSortBy] = useState<"newest" | "price_low" | "price_high" | "area">("newest");

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = clientRef.current;
      let query = supabase
        .from("properties")
        .select(COLUMNS, { count: "exact" })
        .eq("status", "active");

      if (queryText.trim()) {
        const q = queryText.trim().replace(/[%(),]/g, " ");
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,district.ilike.%${q}%,neighborhood.ilike.%${q}%`);
      }
      if (propertyType) query = query.eq("property_type", propertyType);
      if (district) query = query.eq("district", district);
      if (minPrice) query = query.gte("price", Number(minPrice));
      if (maxPrice) query = query.lte("price", Number(maxPrice));
      if (minArea) query = query.gte("area_m2", Number(minArea));
      if (maxArea) query = query.lte("area_m2", Number(maxArea));

      switch (sortBy) {
        case "price_low": query = query.order("price", { ascending: true, nullsFirst: false }); break;
        case "price_high": query = query.order("price", { ascending: false, nullsFirst: false }); break;
        case "area": query = query.order("area_m2", { ascending: false, nullsFirst: false }); break;
        default: query = query.order("created_at", { ascending: false });
      }

      const { data, count: nextCount, error: queryError } = await query.range(0, 47);
      if (queryError) throw queryError;
      setProperties(data ?? []);
      setCount(nextCount ?? 0);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Unknown error";
      logger.error("Failed to load Aqarat OS properties", { error: message });
      setError(dict.common.unexpectedError);
      setProperties([]);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, [dict.common.unexpectedError, district, maxArea, maxPrice, minArea, minPrice, propertyType, queryText, sortBy]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (queryText || propertyType || district || minPrice || maxPrice || minArea || maxArea || sortBy !== "newest") {
        void loadProperties();
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [district, loadProperties, maxArea, maxPrice, minArea, minPrice, propertyType, queryText, sortBy]);

  const updateUrl = useCallback(() => {
    const next = new URLSearchParams();
    if (queryText) next.set("q", queryText);
    if (propertyType) next.set("type", propertyType);
    if (district) next.set("district", district);
    if (minPrice) next.set("minPrice", minPrice);
    if (maxPrice) next.set("maxPrice", maxPrice);
    if (minArea) next.set("minArea", minArea);
    if (maxArea) next.set("maxArea", maxArea);
    window.history.replaceState({}, "", next.toString() ? `?${next}` : window.location.pathname);
  }, [district, maxArea, maxPrice, minArea, minPrice, propertyType, queryText]);

  useEffect(() => updateUrl(), [updateUrl]);

  const types = useMemo(
    () => Array.from(new Set(properties.map((property) => property.property_type).filter(Boolean))).sort() as string[],
    [properties]
  );

  const districts = useMemo(
    () => Array.from(new Set(properties.map((property) => property.district).filter(Boolean))).sort() as string[],
    [properties]
  );

  const clearFilters = () => {
    setQueryText("");
    setPropertyType("");
    setDistrict("");
    setMinPrice("");
    setMaxPrice("");
    setMinArea("");
    setMaxArea("");
    setSortBy("newest");
  };

  const hasFilters = Boolean(queryText || propertyType || district || minPrice || maxPrice || minArea || maxArea);

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar locale={locale} dict={dict} />
      <section className="border-b border-gray-200 bg-white mt-16">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Aqarat OS</p>
              <h1 className="text-2xl font-bold text-gray-900">{dict.explore.title}</h1>
              <p className="mt-1 text-sm text-gray-500">{count} active properties from the authoritative property contract.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <span className="text-gray-400">{locale === "ar" ? "ترتيب" : "Sort"}</span>
                <ArrowUpDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
                <select aria-label={locale === "ar" ? "ترتيب" : "Sort"} value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="bg-transparent outline-none">
                  <option value="newest">{locale === "ar" ? "الأحدث" : "Newest"}</option>
                  <option value="price_low">{locale === "ar" ? "السعر الأقل" : "Lowest price"}</option>
                  <option value="price_high">{locale === "ar" ? "السعر الأعلى" : "Highest price"}</option>
                  <option value="area">{locale === "ar" ? "المساحة" : "Largest area"}</option>
                </select>
              </label>
              {hasFilters && (
                <button onClick={clearFilters} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-2 text-sm text-gray-600 hover:bg-gray-200">
                  <X className="h-4 w-4" aria-hidden="true" />
                  {dict.explore.clearFilters}
                </button>
              )}
              <button
                type="button"
                aria-label={locale === "ar" ? "فلاتر" : "Filters"}
                aria-expanded={showFilters}
                onClick={() => setShowFilters((current) => !current)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                {locale === "ar" ? "فلاتر" : "Filters"}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50/60 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">{locale === "ar" ? "البحث والتصفية" : "Search & filters"}</span>
                <button
                  type="button"
                  aria-controls="advanced-filters-section"
                  aria-expanded={showAdvancedFilters}
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-white"
                >
                  {locale === "ar" ? "فلاتر متقدمة" : "Advanced filters"}
                  <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedFilters ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  <Search className="h-4 w-4 text-gray-400" aria-hidden="true" />
                  <input type="text" value={queryText} onChange={(event) => setQueryText(event.target.value)} placeholder={locale === "ar" ? "ابحث" : "Search"} className="w-full bg-transparent text-sm outline-none" />
                </label>
                <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  <option value="">{locale === "ar" ? "كل الأنواع" : "All types"}</option>
                  {types.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
                <select value={district} onChange={(event) => setDistrict(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                  <option value="">{locale === "ar" ? "كل المناطق" : "All districts"}</option>
                  {districts.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>

              {showAdvancedFilters && (
                <div id="advanced-filters-section" className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} inputMode="numeric" placeholder={locale === "ar" ? "أقل سعر" : "Min price"} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                  <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} inputMode="numeric" placeholder={locale === "ar" ? "أقصى سعر" : "Max price"} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                  <input value={minArea} onChange={(event) => setMinArea(event.target.value)} inputMode="decimal" placeholder={locale === "ar" ? "أقل مساحة م²" : "Min m²"} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                  <input value={maxArea} onChange={(event) => setMaxArea(event.target.value)} inputMode="decimal" placeholder={locale === "ar" ? "أقصى مساحة م²" : "Max m²"} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm" />
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section id="explore-content" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {loading && <div className="mb-4 text-sm text-gray-500">{locale === "ar" ? "جاري التحميل…" : "Loading…"}</div>}
        {error && <div role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
        {!loading && !error && properties.length === 0 && (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            {locale === "ar" ? "لا توجد عقارات نشطة مطابقة." : "No active properties match the current filters."}
          </div>
        )}
        {properties.length > 0 && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {properties.map((property, index) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title ?? `${property.property_type ?? "Property"} ${property.id.slice(0, 8)}`}
                price={property.price}
                area={property.area_m2}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                location={[property.city, property.district, property.neighborhood].filter(Boolean).join(" · ") || null}
                status={property.status}
                type={property.property_type}
                locale={locale}
                dict={dict}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </section>
      <Footer locale={locale} dict={dict} />
    </main>
  );
}
