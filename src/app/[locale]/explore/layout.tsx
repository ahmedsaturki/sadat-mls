import type { Metadata } from "next";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  const title = validLocale === "ar" ? "استكشاف العقارات" : "Explore Properties";
  const description = validLocale === "ar"
    ? "تصفح العقارات المتاحة في مدينة السادات - شقق، فلل، أراضي بأفضل الأسعار"
    : "Browse available properties in Sadat City - apartments, villas, and land at the best prices";

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/explore`,
      languages: {
        ar: `${baseUrl}/ar/explore`,
        en: `${baseUrl}/en/explore`,
      },
    },
    openGraph: {
      type: "website",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      siteName: dict.common.appName,
      title: `${dict.common.appName} | ${title}`,
      description,
      url: `${baseUrl}/${validLocale}/explore`,
      images: [
        {
          url: `/og-image?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&locale=${validLocale}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dict.common.appName} | ${title}`,
      description,
    },
  };
}

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return children;
}
