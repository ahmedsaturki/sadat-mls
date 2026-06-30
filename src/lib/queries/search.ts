import { createClient } from "@/lib/supabase/server";
import { logger } from "@/lib/logger";
import type { Database } from "@/lib/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_types: { name_ar: string; name_en: string } | null;
  zones: { name_ar: string; name_en: string } | null;
  offices: { name: string } | null;
  primaryImage?: string | null;
};

export async function searchProperties(query: string, limit: number = 10): Promise<Property[]> {
  try {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const supabase = await createClient();

    // The textSearch modifier automatically uses our 'fts' column if we format it right.
    // We parse the search term for Supabase's websearch_to_tsquery syntax.
    // 'english' or 'arabic' configuration can be passed in config parameter.
    
    // We are querying the properties table directly and ordering by rank if possible.
    const { data: propertiesRes, error } = await supabase
      .from("properties")
      .select("*, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name)")
      .eq("status", "available")
      .eq("is_active", true)
      .textSearch("fts", query.trim(), {
        type: "websearch",
        config: "arabic",
      })
      .limit(limit);

    if (error || !propertiesRes) {
      return [];
    }

    const propertyIds = propertiesRes.map((p) => p.id);
    const { data: images } = propertyIds.length > 0
      ? await supabase
          .from("property_images")
          .select("property_id, url")
          .in("property_id", propertyIds)
          .eq("is_primary", true)
      : { data: [] };

    const imageMap = new Map(images?.map((img) => [img.property_id, img.url]) || []);
    const withImages = propertiesRes.map((p) => ({
      ...p,
      primaryImage: imageMap.get(p.id) || null,
    }));

    return withImages;
  } catch (err) {
    logger.error("Search properties error", { error: err });
    return [];
  }
}
