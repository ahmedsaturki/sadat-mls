import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { getMessages } from "@/i18n/getMessages";
import { sanitizeJsonLd } from "@/lib/security/sanitizeHtml";
import PropertyDetailClient, { type AqaratPropertyDetail } from "@/components/properties/PropertyDetailClient";

export const dynamic = "force-dynamic";

const PROPERTY_COLUMNS =
  "id, title, description, property_type, transaction_type, status, city, district, neighborhood, address, latitude, longitude, area_m2, bedrooms, bathrooms, floor, finishing, price, currency, features, confidence, first_seen_at, last_seen_at, created_at, updated_at, parcel_number, installments_clear, canonical_key";

type PropertyMeta = Pick<
  AqaratPropertyDetail,
  "title" | "description" | "city" | "district" | "neighborhood"
>;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  if (!isValidLocale(locale as Locale)) return {};

  const dict = getMessages(locale as Locale);
  const supabase = createServiceRoleClient();
  const { data: property } = await supabase
    .from("properties")
    .select("title, description, city, district, neighborhood")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<PropertyMeta, { merge: false }>();

  if (!property) return { title: dict.property.notFound };

  const location = [property.city, property.district, property.neighborhood].filter(Boolean).join(" · ");
  const description = property.description || `${property.title ?? "Property"}${location ? ` - ${location}` : ""}`;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    title: property.title ?? dict.property.notFound,
    description,
    alternates: { canonical: `${baseUrl}/${locale}/explore/${id}` },
    openGraph: {
      title: property.title ?? dict.property.notFound,
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
    .maybeSingle()
    .overrideTypes<AqaratPropertyDetail, { merge: false }>();

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

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: sanitizeJsonLd({
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            name: property.title ?? "Property",
            description: property.description || "",
            url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app"}/${locale}/explore/${id}`,
            offers: {
              "@type": "Offer",
              ...(property.price != null ? { price: property.price } : {}),
              priceCurrency: property.currency || "EGP",
              availability:
                property.status === "active"
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: [property.city, property.district, property.neighborhood]
                .filter(Boolean)
                .join(" · ") || undefined,
              addressCountry: "EG",
            },
            ...(property.area_m2 != null
              ? {
                  floorSize: {
                    "@type": "QuantitativeValue",
                    value: property.area_m2,
                    unitCode: "MTK",
                  },
                }
              : {}),
            ...(property.bedrooms != null ? { numberOfRooms: property.bedrooms } : {}),
            ...(property.bathrooms != null ? { numberOfBathroomsTotal: property.bathrooms } : {}),
          }),
        }}
      />
      <PropertyDetailClient locale={locale} property={property} />
    </Suspense>
  );
}
