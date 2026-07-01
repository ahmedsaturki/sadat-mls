import type { Metadata } from "next";
import { isValidLocale, type Locale } from "@/i18n/config";
import { getMessages } from "@/i18n/getMessages";

interface PageProps {
  params: { locale: string; id: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = params;
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(baseUrl),
    title: dict.office.editProperty,
    alternates: {
      canonical: `${baseUrl}/${validLocale}/dashboard/properties/${id}/edit`,
      languages: {
        "ar": `${baseUrl}/ar/dashboard/properties/${id}/edit`,
        "en": `${baseUrl}/en/dashboard/properties/${id}/edit`,
      },
    },
  };
}

export default function EditPropertyLayout({ children }: { children: React.ReactNode }) {
  return children;
}