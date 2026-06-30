import type { Metadata, Viewport } from "next";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";

interface PageProps {
  params: { locale: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: "Sadat MLS Cloud | منصة العقارات السحابية لمدينة السادات",
      template: "%s | Sadat MLS Cloud",
    },
    description: dict.landing?.heroDescription || "منصة إدارة العقارات السحابية لمدينة السادات السادات",
    keywords: ["عقارات", "مدينة السادات", "بيع", "تأجير", "شقة", "فيلا", "أرض", "real estate", "Sadat City"],
    authors: [{ name: "Sadat MLS Cloud" }],
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
      siteName: "Sadat MLS Cloud",
      title: "Sadat MLS Cloud | منصة العقارات السحابية لمدينة السادات",
      description: dict.landing?.heroDescription || "Cloud Real Estate Platform for Sadat City",
      url: `${baseUrl}/${validLocale}`,
      images: [
        {
          url: `/og-image?title=${encodeURIComponent("Sadat MLS Cloud")}&description=${encodeURIComponent(dict.landing?.heroDescription || "")}&locale=${validLocale}`,
          width: 1200,
          height: 630,
          alt: "Sadat MLS Cloud",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Sadat MLS Cloud",
      description: "Cloud Real Estate Platform for Sadat City",
      images: [`/og-image?title=${encodeURIComponent("Sadat MLS Cloud")}&description=${encodeURIComponent(dict.landing?.heroDescription || "")}&locale=${validLocale}`],
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
  params: { locale: string };
}) {
  const resolvedParams = await Promise.resolve(params);
  const locale = resolvedParams?.locale || "ar";

  if (!isValidLocale(locale)) {
    return null;
  }

  return <>{children}</>;
}
