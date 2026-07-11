import type { Metadata } from "next";
import { getMessages } from "@/i18n/getMessages";
import { type Locale } from "@/i18n/config";
import Providers from "@/components/Providers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = getMessages(locale as Locale);
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  const title = dict.landing?.hero ?? dict.common.appName;
  const description =
    dict.landing?.heroDescription ?? "Cloud real estate platform for Sadat City";

  const keywordsSource = (dict.nav as Record<string, unknown> | undefined)
    ?.keywords;
  const keywords = Array.isArray(keywordsSource)
    ? (keywordsSource as string[])
    : (["real estate", "Sadat City", "buy", "rent", "apartment", "villa", "land"] as string[]);

  return {
    title: {
      default: `${dict.common.appName} | ${title}`,
      template: `%s | ${dict.common.appName}`,
    },
    description,
    keywords,
    authors: [{ name: dict.common.appName }],
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        ar: `${baseUrl}/ar`,
        en: `${baseUrl}/en`,
        "x-default": `${baseUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      locale: locale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_EG",
      siteName: dict.common.appName,
      title: `${dict.common.appName} | ${title}`,
      description,
      url: `${baseUrl}/${locale}`,
      images: [
        {
          url: `${baseUrl}/og-image?title=${encodeURIComponent(dict.common.appName)}&description=${encodeURIComponent(description)}&locale=${locale}`,
          width: 1200,
          height: 630,
          alt: dict.common.appName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.common.appName,
      description,
      images: [
        `${baseUrl}/og-image?title=${encodeURIComponent(dict.common.appName)}&description=${encodeURIComponent(description)}&locale=${locale}`,
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

/**
 * Locale layout — generates locale-specific metadata and wraps children in Providers.
 */
export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>{children}</Providers>
  );
}
