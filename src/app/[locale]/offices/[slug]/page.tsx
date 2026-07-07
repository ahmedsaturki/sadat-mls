"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { getMessages } from "@/i18n/getMessages";
import { usePageLocale } from "@/hooks/usePageLocale";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PropertyCard from "@/components/properties/PropertyCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { Building2, Home, MapPin, Phone, Mail } from "lucide-react";
import { useAuthUser } from "@/hooks/useAuthUser";
import { logger } from "@/lib/logger";

interface Office {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  logo_url: string | null;
  created_at: string;
}

interface OfficeProperty {
  id: string;
  title: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  status: "available" | "reserved" | "sold" | "rented" | "pending_review";
  property_types: { name_ar: string; name_en: string } | null;
  zones: { name_ar: string; name_en: string } | null;
  primaryImage?: string | null;
}

function PublicOfficePage({
  params,
}: {
  params: { locale: string; slug: string };
}) {
  const locale = usePageLocale(params);
  const [office, setOffice] = useState<Office | null>(null);
  const [properties, setProperties] = useState<OfficeProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const { user } = useAuthUser();
  const dict = getMessages(locale);
  const supabase = useMemo(() => createClient(), []);
  const mountedRef = useRef(true);

  const loadOffice = useCallback(async (slug: string) => {
    try {
      const { data: officeData } = await supabase
        .from("offices")
        .select("id, name, slug, email, phone, address, logo_url, is_active")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (!officeData) {
        setNotFound(true);
        return;
      }

      setOffice(officeData);

      const { data: propsData } = await supabase
        .from("properties")
        .select("id, title, price, area, bedrooms, bathrooms, status, created_at, property_types(name_ar, name_en), zones(name_ar, name_en)")
        .eq("office_id", officeData.id)
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(20);

      const propertyIds = (propsData || []).map((p: OfficeProperty) => p.id);
      const { data: images } = propertyIds.length > 0
        ? await supabase
            .from("property_images")
            .select("property_id, url")
            .in("property_id", propertyIds)
            .eq("is_primary", true)
        : { data: null };

      const imageMap = new Map(images?.map((img: { property_id: string; url: string }) => [img.property_id, img.url]) || []);
      const withImages = (propsData || []).map((p: OfficeProperty) => ({
        ...p,
        primaryImage: imageMap.get(p.id) || null,
      }));

      if (!mountedRef.current) return;
      setProperties(withImages);
    } catch (err) {
      logger.error("Failed to load office", { error: err instanceof Error ? err.message : String(err) });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    mountedRef.current = true;
    loadOffice(params.slug);
    return () => { mountedRef.current = false; };
  }, [params, loadOffice]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} dict={dict} />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (notFound || !office) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar locale={locale} dict={dict} />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {dict.admin.notFound}
            </h1>
            <p className="text-gray-500">
              {dict.admin.notFoundDesc}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#office-content" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:bg-white focus:px-4 focus:py-2 focus:text-blue-600 focus:ring-2 focus:ring-blue-500">
        {dict.common.skipToContent}
      </a>
      <Navbar locale={locale} dict={dict} />

      {/* Office Header */}
      <div className="bg-white border-b border-gray-200" id="office-content" tabIndex={-1}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-6">
            {office.logo_url ? (
              <div className="relative w-20 h-20 rounded-2xl overflow-hidden">
                <Image
                  src={office.logo_url}
                  alt={office.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Building2 className="w-10 h-10 text-blue-600" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{office.name}</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {office.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {office.phone}
                  </span>
                )}
                {office.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {office.email}
                  </span>
                )}
                {office.address && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {office.address}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Properties */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Home className="w-5 h-5" />
          {dict.admin.officeProperties}
          <span className="text-sm font-normal text-gray-500">({properties.length})</span>
        </h2>

        {properties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <PropertyCard
                key={property.id}
                id={property.id}
                title={property.title}
                price={property.price}
                area={property.area}
                bedrooms={property.bedrooms}
                bathrooms={property.bathrooms}
                zone={
                  locale === "ar"
                    ? property.zones?.name_ar
                    : property.zones?.name_en
                }
                imageUrl={property.primaryImage || undefined}
                status={property.status}
                officeName={office.name}
                locale={locale}
                type={
                  locale === "ar"
                    ? property.property_types?.name_ar
                    : property.property_types?.name_en
                }
                dict={dict}
                userId={user?.id || null}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl">
            <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {dict.admin.noOfficeProperties}
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer locale={locale} dict={dict} />
    </div>
  );
}

export default function OfficePageWrapper(props: { params: { locale: string; slug: string } }) {
  return (
    <ErrorBoundary>
      <PublicOfficePage {...props} />
    </ErrorBoundary>
  );
}
