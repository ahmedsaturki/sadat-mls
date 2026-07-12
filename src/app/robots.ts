import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/ar/", "/en/", "/ar", "/en"],
        disallow: [
          "/api/",
          "/dashboard/",
          "/admin/",
          "/ar/dashboard/",
          "/en/dashboard/",
          "/ar/admin/",
          "/en/admin/",
          "/ar/login/",
          "/en/login/",
          "/ar/logout/",
          "/en/logout/",
          "/ar/forgot-password/",
          "/en/forgot-password/",
          "/ar/reset-password/",
          "/en/reset-password/",
          "/ar/verify-email/",
          "/en/verify-email/",
          "/og-image/",
          "/*.json$",
          "/_next/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
