import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "@/i18n/getMessages";
import { sanitizeJsonLd } from "@/lib/security/sanitizeHtml";
import PropertyDetailClient, { type AqaratPropertyDetail } from "@/components/properties/PropertyDetailClient";

export const revalidate = 3600;

const PROPERTY_COLUMNS =
  "id, title, description, property_type, transaction_type, status, city, district, neighborhood, address, latitude, longitude, area_m2, bedrooms, bathrooms, floor, finishing, price, currency, features, confidence, first_seen_at, last_seen_at, created_at, updated_at, parcel_number, installments_clear, canonical_key";

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
    .select("title, description, city, district, neighborhood")
    .eq("id", id)
    .maybeSingle();

  if (!property) return { title: dict.property.notFound };

  const location = [property.city, property.district, property.neighborhood].filter(Boolean).join(" · ");
  const description = property.description || `${property.title}${location ? ` - ${location}` : ""}`;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    title: property.title,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/explore/${id}` },
    openGraph: {
      title: property.title,
      description,
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
  if (!isValidLocale(locale as Locale)) notFound();

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) notFound();

  const dict = getMessages(locale as Locale);
  const supabase = await createClient();
  const { data: property, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{dict.property.notFound}</h2>
          <p className="text-gray-500">{dict.property.notFoundDesc}</p>
        </div>
      </div>
    );
  }

  const normalizedProperty: AqaratPropertyDetail = {
    id: property.id,
    title: property.title,
    description: property.description,
    property_type: property.property_type,
    transaction_type: property.transaction_type as AqaratPropertyDetail["transaction_type"],
    status: property.status as AqaratPropertyDetail["status"],
    city: property.city,
    district: property.district,
    neighborhood: property.neighborhood,
    address: property.address,
    latitude: property.latitude,
    longitude: property.longitude,
    area_m2: property.area_m2,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    floor: property.floor,
    finishing: property.finishing,
    price: property.price,
    currency: property.currency,
    features: property.features as Record<string, unknown> | null,
    confidence: property.confidence,
    first_seen_at: property.first_seen_at,
    last_seen_at: property.last_seen_at,
    created_at: property.created_at,
    updated_at: property.updated_at,
    parcel_number: property.parcel_number,
    installments_clear: property.installments_clear,
    canonical_key: property.canonical_key,
  };

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: normalizedProperty.title,
            description: normalizedProperty.description || "",
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/${locale}/explore/${id}`,
            offers: {
              "@type": "Offer",
              price: normalizedProperty.price,
              priceCurrency: normalizedProperty.currency || "EGP",
              availability:
                normalizedProperty.status === "active"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: [normalizedProperty.city, normalizedProperty.district, normalizedProperty.neighborhood]
                .filter(Boolean)
                .join(" · ") || undefined,
              addressCountry: "EG",
            },
            floorSize: {
              "@type": "QuantitativeValue",
              value: normalizedProperty.area_m2,
              unitCode: "MTK",
            },
            numberOfRooms: normalizedProperty.bedrooms,
            numberOfBathroomsTotal: normalizedProperty.bathrooms,
          }),
        }}
      />
      <PropertyDetailClient locale={locale} property={normalizedProperty} images={[]} />
    </Suspense>
  );
}
