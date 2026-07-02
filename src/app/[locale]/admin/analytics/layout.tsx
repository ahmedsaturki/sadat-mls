import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";

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
    title: dict.admin.analytics,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/admin/analytics`,
      languages: {
        "ar": `${baseUrl}/ar/admin/analytics`,
        "en": `${baseUrl}/en/admin/analytics`,
      },
    },
  };
}

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  return children;
}