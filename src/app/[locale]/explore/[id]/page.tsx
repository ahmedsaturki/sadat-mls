import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/i18n/getMessages";
import type { Metadata } from "next";
import PropertyDetailClient from "@/components/properties/PropertyDetailClient";

export const revalidate = 3600; // ISR: revalidate every 1 hour

const PROPERTY_COLUMNS = "id, title, description, property_type_id, zone_id, street, price, area, bedrooms, bathrooms, floors, has_balcony, has_parking, has_elevator, status, is_active, office_id, created_at, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name, phone, email)";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isValidLocale(locale as Locale)) return {};

  const dict = getMessages(locale as Locale);
  const supabase = await createClient();

  const { data: property } = await supabase
    .from("properties")
    .select("title, description, zones(name_ar, name_en), property_types(name_ar, name_en)")
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    return { title: dict.property.notFound };
  }

  // Supabase may return arrays or objects for joined tables depending on config
  const zones = property.zones as unknown as { name_ar: string; name_en: string | null } | null;
  const types = property.property_types as unknown as { name_ar: string; name_en: string | null } | null;
  const zoneName = locale === "ar" ? zones?.name_ar : (zones?.name_en || zones?.name_ar);
  const desc = property.description || `${property.title} - ${zoneName || ""}`;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    title: property.title,
    description: desc,
    alternates: {
      canonical: `${baseUrl}/${locale}/explore/${id}`,
    },
    openGraph: {
      title: property.title,
      description: desc,
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      url: `${baseUrl}/${locale}/explore/${id}`,
    },
  };
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!isValidLocale(locale as Locale)) {
    notFound();
  }

  const dict = getMessages(locale as Locale);
  const supabase = await createClient();

  const [propertyResult, imagesResult] = await Promise.all([
    supabase
      .from("properties")
      .select(PROPERTY_COLUMNS)
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("property_images")
      .select("id, property_id, url, file_path, sort_order, is_primary, created_at")
      .eq("property_id", id)
      .order("sort_order"),
  ]);

  if (!propertyResult.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{dict.property.notFound}</h2>
          <p className="text-gray-500">{dict.property.notFoundDesc}</p>
        </div>
      </div>
    );
  }

  // Normalize joined tables: Supabase may return arrays or objects for single selects
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = propertyResult.data as any;
  const normalizedProperty = {
    ...raw,
    property_types: Array.isArray(raw.property_types) ? (raw.property_types[0] || null) : raw.property_types,
    zones: Array.isArray(raw.zones) ? (raw.zones[0] || null) : raw.zones,
    offices: Array.isArray(raw.offices) ? (raw.offices[0] || null) : raw.offices,
  };

  // Record view analytics (fire-and-forget, server-side)
  const { createServiceRoleClient } = await import("@/lib/supabase/service-role");
  const serviceRole = createServiceRoleClient();
  serviceRole
    .from("property_analytics")
    .insert({
      property_id: id,
      office_id: raw.office_id,
      event_type: "view",
    })
    .then(() => {})
    .catch(() => {});

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy-200 border-t-navy-600 rounded-full animate-spin" />
      </div>
    }>
      {/* JSON-LD Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: raw.title,
            description: raw.description || "",
            url: `${process.env.NEXT_PUBLIC_APP_URL || "https://sadat-mls.vercel.app"}/${locale}/explore/${id}`,
            offers: {
              "@type": "Offer",
              price: raw.price,
              priceCurrency: "EGP",
              availability: raw.status === "available" ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
            floorSize: {
              "@type": "QuantitativeValue",
              value: raw.area,
              unitCode: "MTK",
            },
            numberOfRooms: raw.bedrooms,
            numberOfBathroomsTotal: raw.bathrooms,
            ...(normalizedProperty.zones ? {
              address: {
                "@type": "PostalAddress",
                addressLocality: locale === "ar" ? normalizedProperty.zones.name_ar : (normalizedProperty.zones.name_en || normalizedProperty.zones.name_ar),
                addressCountry: "EG",
              },
            } : {}),
            ...(normalizedProperty.offices ? {
              seller: {
                "@type": "RealEstateAgent",
                name: normalizedProperty.offices.name,
              },
            } : {}),
          }),
        }}
      />
      <PropertyDetailClient
        locale={locale}
        property={normalizedProperty}
        images={imagesResult.data || []}
      />
    </Suspense>
  );
}
