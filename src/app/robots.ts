import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.com";

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
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
