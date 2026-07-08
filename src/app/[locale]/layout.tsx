import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import { Cairo } from "next/font/google";
import { getMessages } from "@/i18n/getMessages";
import { isValidLocale, type Locale } from "@/i18n/config";
import Providers from "@/components/Providers";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

interface PageProps {
  params: Promise<{ locale: string }>;
}

function sanitizeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "string") {
      return value.replace(/[<>&"']/g, (c) => {
        const map: Record<string, string> = {
          "<": "\\u003c",
          ">": "\\u003e",
          "&": "\\u0026",
          '"': "\\u0022",
          "'": "\\u0027",
        };
        return map[c] || c;
      });
    }
    return value;
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";
  const validLocale: Locale = isValidLocale(locale) ? locale : "ar";
  const dict = getMessages(validLocale);
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
      canonical: `${baseUrl}/${validLocale}`,
      languages: {
        ar: `${baseUrl}/ar`,
        en: `${baseUrl}/en`,
        "x-default": `${baseUrl}/ar`,
      },
    },
    openGraph: {
      type: "website",
      locale: validLocale === "ar" ? "ar_EG" : "en_US",
      alternateLocale: validLocale === "ar" ? "en_US" : "ar_EG",
      siteName: dict.common.appName,
      title: `${dict.common.appName} | ${title}`,
      description,
      url: `${baseUrl}/${validLocale}`,
      images: [
        {
          url: `/og-image?title=${encodeURIComponent(dict.common.appName)}&description=${encodeURIComponent(description)}&locale=${validLocale}`,
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
        `/og-image?title=${encodeURIComponent(dict.common.appName)}&description=${encodeURIComponent(description)}&locale=${validLocale}`,
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
    manifest: "/manifest.json",
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#1B2D4F",
};

export function generateStaticParams() {
  return [{ locale: "ar" }, { locale: "en" }];
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Cloud real estate platform for Sadat City",
  url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, ""),
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sadat City",
    addressCountry: "EG",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams?.locale || "ar";
  const dir = locale === "en" ? "ltr" : "rtl";

  if (!isValidLocale(locale)) {
    return null;
  }

  const headersList = await headers();
  const nonce = headersList.get("x-nonce") || "";
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");

  return (
    <html lang={locale} dir={dir} className={`${cairo.variable} font-sans antialiased`} nonce={nonce}>
      <head>
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(r=>r.update()).catch(()=>{})});}`,
          }}
        />
        <Script
          id="org-json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: sanitizeJsonLd(orgJsonLd),
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
