import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers as getHeaders } from "next/headers";
import { Cairo } from "next/font/google";
import { getMessages } from "@/i18n/getMessages";
import { type Locale } from "@/i18n/config";
import Providers from "@/components/Providers";
import HtmlAttributes from "@/components/HtmlAttributes";
import InstallBanner from "@/components/shared/InstallBanner";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

/**
 * Detect locale from the x-locale header set by middleware,
 * the URL path, or the accept-language header as fallback.
 * Falls back to Arabic during static generation when headers() is unavailable.
 */
async function detectLocale(): Promise<Locale> {
  try {
    const h = await getHeaders();
    const localeHeader = h.get("x-locale");
    if (localeHeader === "en" || localeHeader === "ar") return localeHeader;
    // Fallback: extract from URL path via next-url header
    const nextUrl = h.get("next-url");
    if (nextUrl) {
      if (nextUrl.startsWith("/en") || nextUrl.includes("/en/")) return "en";
      if (nextUrl.startsWith("/ar") || nextUrl.includes("/ar/")) return "ar";
    }
    // Fallback: check accept-language
    const acceptLanguage = h.get("accept-language");
    if (acceptLanguage?.includes("en")) return "en";
  } catch {
    // headers() not available during static generation
  }
  return "ar";
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

/**
 * Root layout metadata — minimal default for non-locale routes.
 * Locale-specific metadata is generated in [locale]/layout.tsx which overrides this.
 */
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: {
      default: "Sadat MLS Cloud",
      template: `%s | Sadat MLS Cloud`,
    },
    description: "Cloud real estate platform for Sadat City",
    manifest: "/manifest.json",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await detectLocale();
  const dict = getMessages(locale);
  const dir = locale === "en" ? "ltr" : "rtl";
  const h = await getHeaders();
  const nonce = h.get("x-nonce") || "";

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
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[9999]"
        >
          {dict.common.skipToContent}
        </a>
        <HtmlAttributes />
        <Providers>
          <main id="main-content" tabIndex={-1} className="focus:outline-none">
            {children}
          </main>
          <InstallBanner dict={dict} />
        </Providers>
      </body>
    </html>
  );
}
