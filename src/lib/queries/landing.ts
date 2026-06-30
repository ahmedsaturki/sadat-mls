import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"] & {
  property_types: { name_ar: string; name_en: string } | null;
  zones: { name_ar: string; name_en: string } | null;
  offices: { name: string } | null;
  primaryImage?: string | null;
};

interface LandingData {
  properties: Property[];
  officesCount: number;
  propertiesCount: number;
  zonesCount: number;
}

export async function getLandingData(searchQuery?: string): Promise<LandingData> {
  try {
    const supabase = await createClient();

    let propertiesQuery = supabase
      .from("properties")
      .select("*, property_types(name_ar, name_en), zones(name_ar, name_en), offices(name)")
      .eq("status", "available")
      .eq("is_active", true);

    if (searchQuery && searchQuery.trim().length > 0) {
      propertiesQuery = propertiesQuery.textSearch("fts", searchQuery.trim(), {
        type: "websearch",
        config: "arabic",
      });
    } else {
      propertiesQuery = propertiesQuery.order("created_at", { ascending: false });
    }

    propertiesQuery = propertiesQuery.limit(6);

    const [officesRes, propertiesRes, zonesRes, featuredRes] = await Promise.all([
      supabase.from("offices").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("properties").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("zones").select("id", { count: "exact", head: true }),
      propertiesQuery,
    ]);

    const propertyIds = (featuredRes.data || []).map((p) => p.id);
    const { data: images } = propertyIds.length > 0
      ? await supabase
          .from("property_images")
          .select("property_id, url")
          .in("property_id", propertyIds)
          .eq("is_primary", true)
      : { data: [] };

    const imageMap = new Map(images?.map((img) => [img.property_id, img.url]) || []);
    const withImages = (featuredRes.data || []).map((p) => ({
      ...p,
      primaryImage: imageMap.get(p.id) || null,
    }));

    return {
      properties: withImages,
      officesCount: officesRes.count || 0,
      propertiesCount: propertiesRes.count || 0,
      zonesCount: zonesRes.count || 0,
    };
  } catch {
    return { properties: [], officesCount: 0, propertiesCount: 0, zonesCount: 0 };
  }
}
