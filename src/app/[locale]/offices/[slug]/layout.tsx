import type { Metadata } from "next";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const supabase = await createClient();
  const { data: office } = await supabase
    .from("offices")
    .select("name, logo_url, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!office) {
    return {
      title: dict.office.notFound,
    };
  }

  const imageUrl = office.logo_url ? new URL(office.logo_url, baseUrl).toString() : undefined;

  return {
    metadataBase: new URL(baseUrl),
    title: office.name,
    description: office.description || (dict.landing?.heroDescription ?? ""),
    alternates: {
      canonical: `${baseUrl}/${validLocale}/offices/${slug}`,
      languages: {
        "ar": `${baseUrl}/ar/offices/${slug}`,
        "en": `${baseUrl}/en/offices/${slug}`,
      },
    },
    openGraph: {
      type: "website",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      siteName: dict.common.appName,
      title: office.name,
      description: office.description || (dict.landing?.heroDescription ?? ""),
      url: `${baseUrl}/${validLocale}/offices/${slug}`,
      images: imageUrl ? [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: office.name,
        },
      ] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: office.name,
      description: office.description || (dict.landing?.heroDescription ?? ""),
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return children;
}