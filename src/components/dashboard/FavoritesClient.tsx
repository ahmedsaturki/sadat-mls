"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Heart } from "lucide-react";
import PropertyCard from "@/components/properties/PropertyCard";
import { SkeletonCard } from "@/components/ui/Skeleton";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getMessages } from "@/i18n/getMessages";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import type { Database } from "@/lib/supabase/types";
import { ROLES, type UserRole } from "@/lib/utils/constants";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";
import { type Locale } from "@/i18n/config";

type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_types: { name_ar: string } | null;
  zones: { name_ar: string } | null;
  offices: { name: string } | null;
  primaryImage?: string | null;
};

const PAGE_SIZE = 9;

export default function FavoritesClient({
  params,
}: {
  params: { locale: string; userId: string };
}) {
  const typedLocale = params.locale as Locale;
  const dict = getMessages(typedLocale);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const { supabase, user, profile } = useAuthUser();
  const userRole = (profile?.role as UserRole) || ROLES.OFFICE_AGENT;

  const mountedRef = useRef(true);
  const totalPages = Math.ceil(properties.length / PAGE_SIZE);

  const paginatedProperties = useMemo(
    () => properties.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [properties, page]
  );

  const loadFavorites = useCallback(async () => {
    if (!user || !mountedRef.current) {
      setLoading(false);
      return;
    }

    try {
      const { data: favorites } = await supabase
        .from("property_favorites")
        .select("property_id")
        .eq("user_id", user.id);

      if (!favorites || favorites.length === 0) {
        return;
      }

      const propertyIds = favorites.map((f: { property_id: string }) => f.property_id);

      const [{ data: props }, { data: images }] = await Promise.all([
        supabase
          .from("properties")
          .select("id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, status, created_at, property_types(name_ar), zones(name_ar), offices(name)")
          .in("id", propertyIds),
        supabase
          .from("property_images")
          .select("property_id, url")
          .in("property_id", propertyIds)
          .eq("is_primary", true),
      ]);

      if (props) {
        const imageMap = new Map(images?.map((img: { property_id: string; url: string }) => [img.property_id, img.url]) || []);
        setProperties(props.map((p: Property) => ({
          ...p,
          primaryImage: imageMap.get(p.id) || null,
        })));
      }
    } catch (err) {
      logger.error("Failed to load favorites", { error: err instanceof Error ? err.message : "Unknown" });
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    mountedRef.current = true;
    loadFavorites();
    return () => { mountedRef.current = false; };
  }, [loadFavorites]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`favorites-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "property_favorites",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadFavorites()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, user, loadFavorites]);

  return (
    <DashboardLayout locale={typedLocale} dict={dict} role={userRole}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          {dict.common.favorites}
        </h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : properties.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list" aria-live="polite">
              {paginatedProperties.map((property) => (
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
                  locale={typedLocale}
                  type={property.property_types?.name_ar}
                  dict={dict}
                  userId={user?.id || null}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dict.common.previous}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p: number) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    aria-label={`${p}`}
                    aria-current={page === p ? "page" : undefined}
                    className={`px-3 py-2 text-sm font-medium rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 ${
                      page === p
                        ? "bg-navy-600 text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {dict.common.next}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16" role="status">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {dict.common.noFavorites}
            </h2>
            <p className="text-sm text-gray-500">
              {dict.common.addFavoritesHint}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
