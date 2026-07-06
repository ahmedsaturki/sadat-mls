import type { Metadata, Viewport } from "next";
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
    title: {
      default: `${dict.common.appName} | ${dict.landing?.hero ?? ""}`,
      template: `%s | ${dict.common.appName}`,
    },
    description: dict.landing?.heroDescription ?? "",
    keywords: (dict.common as Record<string, unknown>)?.keywords as string[] ?? ["real estate", "Sadat City", "buy", "rent", "apartment", "villa", "land"],
    authors: [{ name: dict.common.appName }],
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        "ar": `${baseUrl}/ar`,
        "en": `${baseUrl}/en`,
      },
    },
    openGraph: {
      type: "website",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: validLocale === "ar" ? "en_US" : "ar_EG",
      siteName: dict.common.appName,
      title: `${dict.common.appName} | ${dict.landing?.hero ?? ""}`,
      description: dict.landing?.heroDescription ?? "",
      url: `${baseUrl}/${validLocale}`,
      images: [
        {
          url: `/og-image?title=${encodeURIComponent(dict.common.appName)}&description=${encodeURIComponent(dict.landing?.heroDescription ?? "")}&locale=${validLocale}`,
          width: 1200,
          height: 630,
          alt: dict.common.appName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dict.common.appName,
      description: dict.landing?.heroDescription ?? "",
      images: [`/og-image?title=${encodeURIComponent(dict.common.appName)}&description=${encodeURIComponent(dict.landing?.heroDescription ?? "")}&locale=${validLocale}`],
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
    manifest: "/manifest.json",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";

  if (!isValidLocale(locale)) {
    return null;
  }

  return <>{children}</>;
}
