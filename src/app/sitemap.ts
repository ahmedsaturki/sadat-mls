import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { type Database } from "@/lib/supabase/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sadat-mls.vercel.app";
const LOCALES = ["ar", "en"] as const;

type SitemapProperty = Pick<
  Database["public"]["Tables"]["properties"]["Row"],
  "id" | "updated_at" | "status"
>;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = ["", "/explore"] as const;
  const entries: MetadataRoute.Sitemap = [];
  const now = new Date();

  for (const route of staticRoutes) {
    for (const locale of LOCALES) {
      entries.push({
        url: `${BASE_URL}/${locale}${route}`,
        lastModified: now,
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

  const supabase = await createClient();
  const { data: properties, error } = await supabase
    .from("properties")
    .select("id, updated_at, status")
    .eq("status", "active")
    .order("updated_at", { ascending: false })
    .limit(1000)
    .overrideTypes<SitemapProperty[], { merge: false }>();

  if (!error && properties) {
    for (const property of properties) {
      for (const locale of LOCALES) {
        entries.push({
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

  return entries;
}
