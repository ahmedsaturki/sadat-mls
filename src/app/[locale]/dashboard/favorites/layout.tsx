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

  return {
    metadataBase: new URL(baseUrl),
    title: dict.dashboard.favorites,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/dashboard/favorites`,
      languages: {
        "ar": `${baseUrl}/ar/dashboard/favorites`,
        "en": `${baseUrl}/en/dashboard/favorites`,
      },
    },
  };
}

export default function FavoritesLayout({ children }: { children: React.ReactNode }) {
  return children;
}