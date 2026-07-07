import { Cairo } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { headers } from "next/headers";
import Providers from "@/components/Providers";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Cloud real estate platform for Sadat City",
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
  themeColor: "#1B2D4F",
};

export const metadata: Metadata = {
  title: {
    default: process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud",
    template: `%s | ${process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud"}`,
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ||
    "Cloud real estate platform for Sadat City",
  manifest: "/manifest.json",
  applicationName: "Sadat MLS Cloud",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: process.env.NEXT_PUBLIC_SITE_NAME || "Sadat MLS Cloud",
  },
  formatDetection: {
    telephone: false,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Root layout handles only non-localized routes
  // (e.g. /not-found hits this before middleware redirects,
  // service worker, manifest, robots, sitemap, etc.)
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language") || "ar";
  const locale = acceptLanguage.startsWith("en") ? "en" : "ar";
  const dir = locale === "en" ? "ltr" : "rtl";
  const nonce = headersList.get("x-nonce") || "";

  return (
    <html lang={locale} dir={dir} className={cairo.variable} nonce={nonce}>
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
        <link rel="alternate" hrefLang="ar" href={`${baseUrl}/ar`} />
        <link rel="alternate" hrefLang="en" href={`${baseUrl}/en`} />
        <link rel="alternate" hrefLang="x-default" href={`${baseUrl}/ar`} />
      </head>
      <body className="min-h-screen bg-gray-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
