import type { Metadata } from "next";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

type PropertyMeta = {
  title: string | null;
  description: string | null;
  city: string | null;
  district: string | null;
  neighborhood: string | null;
  status: string;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  const supabase = await createClient();
  const { data: property } = await supabase
    .from("properties")
    .select("title, description, city, district, neighborhood, status")
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<PropertyMeta, { merge: false }>();

  if (!property) return { title: dict.property.notFound };

  const title = property.title ?? dict.property.notFound;
  const location = [property.city, property.district, property.neighborhood].filter(Boolean).join(" · ");
  const description = property.description || `${title}${location ? ` - ${location}` : ""}`;
  const url = `${baseUrl}/${validLocale}/explore/${id}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        ar: `${baseUrl}/ar/explore/${id}`,
        en: `${baseUrl}/en/explore/${id}`,
      },
    },
    openGraph: {
      type: "website",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      siteName: dict.common.appName,
      title,
      description,
      url,
      images: [],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [],
    },
  };
}

export default function PropertyDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
