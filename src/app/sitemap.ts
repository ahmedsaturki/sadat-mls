import { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const locales = ["ar", "en"];
  const staticRoutes = ["", "/explore"];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add static pages for each locale
  for (const route of staticRoutes) {
    for (const locale of locales) {
      sitemapEntries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "weekly",
        priority: route === "" ? 1.0 : 0.8,
        alternates: {
          languages: {
            ar: `${BASE_URL}/ar${route}`,
            en: `${BASE_URL}/en${route}`,
          },
        },
      });
    }
  }

  // Add login page
  for (const locale of locales) {
    const otherLocale = locale === "ar" ? "en" : "ar";
    sitemapEntries.push({
      url: `${BASE_URL}/${locale}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
      alternates: {
        languages: {
          [locale]: `${BASE_URL}/${locale}/login`,
          [otherLocale]: `${BASE_URL}/${otherLocale}/login`,
        },
      },
    });
  }

  // Add office profile pages
  try {
    const supabaseForOffices = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: offices } = await supabaseForOffices
      .from("offices")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (offices) {
      for (const office of offices) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${BASE_URL}/${locale}/offices/${office.slug}`,
            lastModified: new Date(office.updated_at || new Date()),
            changeFrequency: "weekly",
            priority: 0.6,
            alternates: {
              languages: {
                ar: `${BASE_URL}/ar/offices/${office.slug}`,
                en: `${BASE_URL}/en/offices/${office.slug}`,
              },
            },
          });
        }
      }
    }
  } catch {
    logger.warn("Failed to fetch offices for sitemap");
  }

  // Add individual property pages
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: properties } = await supabase
      .from("properties")
      .select("id, updated_at")
      .eq("is_active", true)
      .eq("status", "available")
      .order("updated_at", { ascending: false })
      .limit(1000);

    if (properties) {
      for (const property of properties) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${BASE_URL}/${locale}/explore/${property.id}`,
            lastModified: new Date(property.updated_at),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
              languages: {
                ar: `${BASE_URL}/ar/explore/${property.id}`,
                en: `${BASE_URL}/en/explore/${property.id}`,
              },
            },
          });
        }
      }
    }
  } catch {
    logger.warn("Failed to fetch properties for sitemap");
  }

  // Add developer pages
  try {
    const { data: developers } = await supabaseForOffices
      .from("developers")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (developers) {
      for (const dev of developers) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${BASE_URL}/${locale}/developers/${dev.slug}`,
            lastModified: new Date(dev.updated_at || new Date()),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
              languages: {
                ar: `${BASE_URL}/ar/developers/${dev.slug}`,
                en: `${BASE_URL}/en/developers/${dev.slug}`,
              },
            },
          });
        }
      }
    }
  } catch {
    logger.warn("Failed to fetch developers for sitemap");
  }

  // Add project pages
  try {
    const { data: projects } = await supabaseForOffices
      .from("projects")
      .select("slug, updated_at")
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(200);

    if (projects) {
      for (const proj of projects) {
        for (const locale of locales) {
          sitemapEntries.push({
            url: `${BASE_URL}/${locale}/projects/${proj.slug}`,
            lastModified: new Date(proj.updated_at || new Date()),
            changeFrequency: "weekly",
            priority: 0.7,
            alternates: {
              languages: {
                ar: `${BASE_URL}/ar/projects/${proj.slug}`,
                en: `${BASE_URL}/en/projects/${proj.slug}`,
              },
            },
          });
        }
      }
    }
  } catch {
    logger.warn("Failed to fetch projects for sitemap");
  }

  return sitemapEntries;
}
