import { Cairo } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Script from "next/script";
import Providers from "@/components/Providers";
import "./globals.css";
import { sanitizeJsonLd } from "@/lib/security/sanitizeHtml";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-cairo",
});

export const metadataBase = new URL(
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
);

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "Sadat MLS Cloud",
  description: "Cloud real estate platform for Sadat City",
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
  title: "Sadat MLS Cloud - منصة العقارات السحابية",
  description: "منصة إدارة العقارات السحابية لمدينة السادات",
  manifest: "/manifest.json",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} data-scroll-behavior="smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=location.pathname.split('/')[1];if(l==='en'){document.documentElement.lang='en';document.documentElement.dir='ltr';}})();`,
          }}
        />
        <Script
          id="sw-registration"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js").catch(()=>{})});}`,
          }}
        />
        <script
          type="application/ld+json"
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
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg"
        >
          تخطي إلى المحتوى الرئيسي
        </a>
        <Providers>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
