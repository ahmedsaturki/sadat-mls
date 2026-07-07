import { Cairo } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import Providers from "@/components/Providers";
import "./globals.css";
import { getMessages } from "@/i18n/getMessages";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function sanitizeJsonLd(obj: Record<string, unknown>): string {
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === "string") {
      return value.replace(/[<>&"']/g, (c) => {
        const map: Record<string, string> = { "<": "\\u003c", ">": "\\u003e", "&": "\\u0026", '"': "\\u0022", "'": "\\u0027" };
        return map[c] || c;
      });
    }
    return value;
  });
}

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Cloud real estate platform for Sadat City",
  url: baseUrl,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sadat City",
    addressCountry: "EG",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#2563eb",
};

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud",
  description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || "Cloud real estate platform for Sadat City",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get locale from Accept-Language header or default to ar
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "ar";
  const locale = acceptLanguage.startsWith("en") ? "en" : "ar";
  const dir = locale === "en" ? "ltr" : "rtl";
  const lang = locale === "en" ? "en" : "ar";
  const dict = getMessages(locale);
  const nonce = headersList.get("x-nonce") || "";
  
  return (
    <html lang={lang} dir={dir} className={cairo.variable} data-scroll-behavior="smooth" nonce={nonce}>
      <head>
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").then(r=>r.update()).catch(()=>{})});}`,
          }}
        />
        <Script
          id="org-json-ld"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: sanitizeJsonLd(orgJsonLd),
          }}
        />
        <link rel="alternate" hrefLang="ar" href={`${baseUrl}/ar`} />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/ar`} />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 z-[100] bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
        >
          {dict.common.skipToContent}
        </a>
        <Providers>
          <main
            id="main-content"
            tabIndex={-1}
            className="outline-none"
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}