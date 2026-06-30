import type { Metadata } from "next";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Fetch property data for metadata
  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("title, description, price, status, area, bedrooms, bathrooms, property_type_id, zone_id, office_id, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name)")
    .eq("id", id)
    .maybeSingle();

  if (!property) {
    return {
      title: dict.property.notFound || "Property Not Found",
    };
  }

  const { data: images } = await supabase
    .from("property_images")
    .select("url")
    .eq("property_id", id)
    .eq("is_primary", true)
    .limit(1);

  const primaryImage = images?.[0]?.url;
  const imageUrl = primaryImage ? new URL(primaryImage, baseUrl).toString() : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title: property.title,
    description: property.description || dict.landing?.heroDescription || "Cloud real estate platform for Sadat City",
    alternates: {
      canonical: `${baseUrl}/${validLocale}/explore/${id}`,
      languages: {
        "ar": `${baseUrl}/ar/explore/${id}`,
        "en": `${baseUrl}/en/explore/${id}`,
      },
    },
    openGraph: {
      type: "website",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      siteName: "Sadat MLS Cloud",
      title: property.title,
      description: property.description || dict.landing?.heroDescription || "Cloud real estate platform for Sadat City",
      url: `${baseUrl}/${validLocale}/explore/${id}`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: property.title,
        },
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: property.title,
      description: property.description || dict.landing?.heroDescription || "Cloud real estate platform for Sadat City",
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function PropertyDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}